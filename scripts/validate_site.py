#!/usr/bin/env python3
"""Validate the homepage release bundle, without crawling or network access."""

import argparse
from dataclasses import dataclass, field
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit


VOID_TAGS = set("area base br col embed hr img input link meta param source track wbr".split())
IDREFS = ("aria-labelledby", "aria-describedby", "aria-controls", "data-copy", "data-copy-select")


@dataclass
class Element:
    tag: str
    attrs: dict
    line: int
    content_line: int
    children: list = field(default_factory=list)

    def descendants(self):
        for child in self.children:
            if isinstance(child, Element):
                yield child
                yield from child.descendants()

    def text(self):
        return "".join(child.text() if isinstance(child, Element) else child for child in self.children)


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.root = Element("document", {}, 1, 1)
        self.stack = [self.root]
        self.feed(text)
        self.close()
        self.elements = list(self.root.descendants())

    def handle_starttag(self, tag, attrs):
        line = self.getpos()[0]
        node = Element(tag, dict(attrs), line, line + self.get_starttag_text().count("\n"))
        self.stack[-1].children.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def srcset_urls(value):
    """Read conventional URL + width/density candidates; keep data-URL commas."""
    position = 0
    while position < len(value):
        while position < len(value) and (value[position].isspace() or value[position] == ","):
            position += 1
        start = position
        while position < len(value) and not value[position].isspace():
            position += 1
        url = value[start:position]
        if not url:
            break
        yield url.rstrip(",")
        if url.endswith(","):
            continue
        while position < len(value) and value[position] != ",":
            position += 1


def normalized(text):
    return text.replace("\r\n", "\n").strip()


def reject_json_constant(value):
    raise ValueError("non-JSON constant " + value)


class Validator:
    def __init__(self, root):
        self.root = root.resolve()
        self.errors = []
        self.citations = 0

    def error(self, path, line, message):
        try:
            label = path.relative_to(self.root).as_posix()
        except ValueError:
            label = str(path)
        self.errors.append(f"{label}:{line}: {message}")

    def read(self, path):
        try:
            path.resolve().relative_to(self.root)
            return path.read_text(encoding="utf-8")
        except (OSError, UnicodeError, ValueError, RuntimeError) as error:
            self.error(path, 1, f"cannot read in-site UTF-8 file: {error}")
            return None

    def local_path(self, page, node, value, ids):
        try:
            url = urlsplit(value.strip().replace("\\", "/"))
            if url.scheme or url.netloc:
                return None
            name = unquote(url.path).replace("\\", "/")
            base = self.root if name.startswith("/") else page.parent
            target = (base / name.lstrip("/")).resolve() if name else page.resolve()
            target.relative_to(self.root)
            if target.is_dir():
                target = (target / "index.html").resolve()
                target.relative_to(self.root)
            if not target.is_file():
                self.error(page, node.line, f"missing local resource: {value!r}")
                return None
        except (OSError, ValueError, RuntimeError) as error:
            self.error(page, node.line, f"invalid or outside-site resource {value!r}: {error}")
            return None
        fragment = unquote(url.fragment).split(":~:", 1)[0]
        if target == page.resolve() and fragment and fragment not in ids:
            self.error(page, node.line, f"missing fragment target #{fragment}")
        return target

    def validate_page(self, page):
        text = self.read(page)
        if text is None:
            return
        document = Document(text)
        ids = {}
        for node in document.elements:
            identifier = node.attrs.get("id")
            if identifier is not None:
                if identifier in ids:
                    self.error(page, node.line, f"duplicate id {identifier!r} (first at line {ids[identifier]})")
                else:
                    ids[identifier] = node.line

        links = {}
        for node in document.elements:
            for attr in ("href", "src", "xlink:href"):
                if attr in node.attrs:
                    target = self.local_path(page, node, node.attrs[attr] or "", ids)
                    if attr == "href":
                        links[id(node)] = target
            for value in srcset_urls(node.attrs.get("srcset") or ""):
                self.local_path(page, node, value, ids)
            for attr in IDREFS:
                if attr not in node.attrs:
                    continue
                value = node.attrs[attr] or ""
                targets = value.split() if attr.startswith("aria-") else [value]
                for identifier in targets:
                    if identifier not in ids:
                        self.error(page, node.line, f"{attr} references missing id {identifier!r}")
            if node.tag == "script" and (node.attrs.get("type") or "").lower() == "application/ld+json":
                try:
                    json.loads(node.text(), parse_constant=reject_json_constant)
                except json.JSONDecodeError as error:
                    self.error(page, node.content_line + error.lineno - 1, f"invalid JSON-LD: {error.msg}")
                except ValueError as error:
                    self.error(page, node.content_line, f"invalid JSON-LD: {error}")

        self.validate_citations(page, document, links)

    def validate_citations(self, page, document, links):
        blocks = [node for node in document.elements if "citation" in (node.attrs.get("class") or "").split()]
        self.citations += len(blocks)
        entries = []
        for block in blocks:
            descendants = list(block.descendants())
            pres = [node for node in descendants if node.tag == "pre"]
            downloads = [node for node in descendants if node.tag == "a" and "download" in node.attrs]
            bibs = [node for node in downloads if links.get(id(node)) and links[id(node)].suffix.lower() == ".bib"]
            if len(pres) != 1 or len(bibs) != 1:
                self.error(page, block.line, ".citation requires one inline pre and one existing local .bib download")
                continue
            bib_path = links[id(bibs[0])]
            bib = self.read(bib_path)
            if bib is None:
                continue
            entries.append(normalized(bib))
            if normalized(pres[0].text()) != entries[-1]:
                self.error(page, pres[0].line, f"inline citation differs from {bib_path.relative_to(self.root).as_posix()}")

        collections = {}
        for node in document.elements:
            target = links.get(id(node))
            if node.tag == "a" and "download" in node.attrs and target and target.name == "publications.bib":
                collections.setdefault(target, node.line)
        if blocks and not collections:
            self.error(page, blocks[0].line, "missing local publications.bib download for citation collection")
        if len(entries) == len(blocks):
            expected = "\n\n".join(entries)
            for path, line in collections.items():
                collection = self.read(path)
                if collection is not None and normalized(collection) != expected:
                    self.error(page, line, f"{path.relative_to(self.root).as_posix()} differs from citation downloads joined in page order with one blank line")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("site_root", type=Path, help="website root, including a prepared _site directory")
    args = parser.parse_args()
    validator = Validator(args.site_root)
    for name in ("index.html", "404.html"):
        validator.validate_page(validator.root / name)
    if validator.errors:
        print("\n".join(validator.errors), file=sys.stderr)
        print(f"Validation failed: {len(validator.errors)} error(s).", file=sys.stderr)
        return 1
    print(f"Validated index.html and 404.html; {validator.citations} citation block(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
