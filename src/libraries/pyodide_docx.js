const DEFAULT_BASE_PATH = `${ASSETS_URL}pymupdf/`;
const DEFAULT_FONT_URL = `${ASSETS_URL}fonts/NotoSansSC-Regular.ttf`;
const PDF_MIME = 'application/pdf';
const FONT_PATH = '/NotoSansSC-Regular.ttf';
const BUNDLED_FONT_RESOURCES = [
    { url: `${ASSETS_URL}fonts/Carlito-Regular.ttf`, path: '/Carlito-Regular.ttf', label: 'Carlito Regular' },
    { url: `${ASSETS_URL}fonts/Carlito-Bold.ttf`, path: '/Carlito-Bold.ttf', label: 'Carlito Bold' },
    { url: `${ASSETS_URL}js/pdfjs-dist/web/standard_fonts/LiberationSans-Regular.ttf`, path: '/LiberationSans-Regular.ttf', label: 'Liberation Sans Regular' },
    { url: `${ASSETS_URL}js/pdfjs-dist/web/standard_fonts/LiberationSans-Bold.ttf`, path: '/LiberationSans-Bold.ttf', label: 'Liberation Sans Bold' }
];

const PACKAGES = [
    { file: 'typing_extensions-4.12.2-py3-none-any.whl', percent: 8, phase: 'installing-dependencies' },
    { file: 'lxml-5.4.0-cp313-cp313-pyodide_2025_0_wasm32.whl', percent: 12, phase: 'installing-dependencies' },
    { file: 'python_docx-1.2.0-py3-none-any.whl', percent: 16, phase: 'installing-docx' },
    { file: 'fonttools-4.56.0-py3-none-any.whl', percent: 20, phase: 'installing-dependencies' },
    { file: 'pymupdf-1.26.3-cp313-none-pyodide_2025_0_wasm32.whl', percent: 22, phase: 'installing-pdf' }
];

const DEFAULT_CALLBACK = {
    onBeforeInit: () => {},
    onInitialize: () => {},
    onAfterInit: () => {},
    onConvert: () => {}
};

const PYTHON_CONVERTER = String.raw`
import io
import math
import os
import re
import fitz
from fontTools import subset
from fontTools.ttLib import TTFont
from lxml import etree
from docx import Document
from docx.text.paragraph import Paragraph
from docx.text.hyperlink import Hyperlink
from docx.table import Table
from docx.enum.text import WD_ALIGN_PARAGRAPH

SOURCE_FONT_FILES = {
    "carlito": {
        "regular": "/Carlito-Regular.ttf",
        "bold": "/Carlito-Bold.ttf",
    },
    "liberation": {
        "regular": "/LiberationSans-Regular.ttf",
        "bold": "/LiberationSans-Bold.ttf",
    },
    "cjk": {
        "regular": "/NotoSansSC-Regular.ttf",
    },
}
DOCUMENT_FONT_FILES = {
    "carlito-regular": "/tmp/Carlito-Regular-Document.ttf",
    "carlito-bold": "/tmp/Carlito-Bold-Document.ttf",
    "liberation-regular": "/tmp/LiberationSans-Regular-Document.ttf",
    "liberation-bold": "/tmp/LiberationSans-Bold-Document.ttf",
    "cjk-regular": "/tmp/NotoSansSC-Document.otf",
}
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WP_NS = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
C_NS = "http://schemas.openxmlformats.org/drawingml/2006/chart"
NS = {"w": W_NS, "a": A_NS, "r": R_NS, "wp": WP_NS, "c": C_NS}
W = "{" + W_NS + "}"
R = "{" + R_NS + "}"


def _input_to_bytes(input_obj):
    if hasattr(input_obj, "to_py"):
        return input_obj.to_py().tobytes()
    return bytes(input_obj)


def _emu_to_pt(value):
    try:
        return int(value) / 12700
    except (TypeError, ValueError):
        return 0


def _twips_to_pt(value, default=0):
    try:
        return int(value) / 20
    except (TypeError, ValueError):
        return default


def _attr(element, name, default=None):
    if element is None:
        return default
    return element.get(W + name, default)


def _normalize_numbering_text(text):
    return str(text or "").replace("\uf0b7", "\u2022").replace("\uf0a7", "\u25aa")


def _collect_document_codepoints(doc):
    codepoints = set(range(0x20, 0x7F))
    for text_element in doc.element.body.iter(W + "t"):
        if text_element.text:
            codepoints.update(ord(char) for char in text_element.text)

    try:
        numbering_root = doc.part.numbering_part.element
    except Exception:
        numbering_root = None
    if numbering_root is not None:
        for level_text in numbering_root.findall(".//w:lvlText", NS):
            normalized = _normalize_numbering_text(_attr(level_text, "val", ""))
            codepoints.update(ord(char) for char in normalized)

    for relationship in doc.part.rels.values():
        if not relationship.reltype.endswith("/chart"):
            continue
        try:
            chart_root = etree.fromstring(relationship.target_part.blob)
        except Exception:
            continue
        for text_element in chart_root.findall(".//c:v", NS) + chart_root.findall(".//a:t", NS):
            if text_element.text:
                codepoints.update(ord(char) for char in text_element.text)
    return codepoints


def _subset_document_font(source_file, output_file, codepoints):
    font = None
    try:
        font = TTFont(source_file)
        supported = set()
        for cmap_table in font["cmap"].tables:
            if cmap_table.isUnicode():
                supported.update(cmap_table.cmap)
        selected = codepoints & supported
        if not selected:
            return None

        for cmap_table in font["cmap"].tables:
            if cmap_table.isUnicode():
                cmap_table.cmap = {
                    codepoint: glyph
                    for codepoint, glyph in cmap_table.cmap.items()
                    if codepoint in selected
                }

        options = subset.Options()
        options.retain_gids = True
        options.layout_features = ["*"]
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(unicodes=selected)
        subsetter.subset(font)
        font.save(output_file)
        return output_file
    except Exception as error:
        if os.path.exists(output_file):
            os.remove(output_file)
        raise RuntimeError("Failed to prepare the document font.") from error
    finally:
        if font is not None:
            font.close()


def _prepare_document_fonts(doc):
    for output_file in DOCUMENT_FONT_FILES.values():
        if os.path.exists(output_file):
            os.remove(output_file)

    codepoints = _collect_document_codepoints(doc)
    prepared = {}
    source_map = {
        "carlito-regular": SOURCE_FONT_FILES["carlito"]["regular"],
        "carlito-bold": SOURCE_FONT_FILES["carlito"]["bold"],
        "liberation-regular": SOURCE_FONT_FILES["liberation"]["regular"],
        "liberation-bold": SOURCE_FONT_FILES["liberation"]["bold"],
        "cjk-regular": SOURCE_FONT_FILES["cjk"]["regular"],
    }
    try:
        for key, source_file in source_map.items():
            if not os.path.exists(source_file):
                raise RuntimeError("Required font is unavailable: {}".format(source_file))
            requested = codepoints
            output_file = DOCUMENT_FONT_FILES[key]
            subset_file = _subset_document_font(source_file, output_file, requested)
            if subset_file:
                prepared[key] = subset_file
        return prepared
    except Exception:
        for output_file in DOCUMENT_FONT_FILES.values():
            if os.path.exists(output_file):
                os.remove(output_file)
        raise


def _alpha_number(value, upper=False):
    value = max(1, int(value))
    output = ""
    while value:
        value -= 1
        output = chr((65 if upper else 97) + value % 26) + output
        value //= 26
    return output


def _roman_number(value, upper=False):
    value = max(1, int(value))
    pairs = (
        (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
        (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
        (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
    )
    output = []
    for number, token in pairs:
        while value >= number:
            output.append(token)
            value -= number
    result = "".join(output)
    return result if upper else result.lower()


def convert_docx_to_pdf(input_obj):
    input_bytes = _input_to_bytes(input_obj)
    doc = Document(io.BytesIO(input_bytes))
    document_fonts = _prepare_document_fonts(doc)
    try:
        return _render_docx_to_pdf(doc, document_fonts)
    finally:
        for document_font_file in document_fonts.values():
            if os.path.exists(document_font_file):
                try:
                    os.remove(document_font_file)
                except OSError:
                    pass


def _render_docx_to_pdf(doc, document_fonts):
    pdf = fitz.open()

    spacing_fallback = {
        "title": 12,
        "heading 1": 10,
        "heading 2": 8,
        "heading 3": 6,
        "heading 4": 5,
        "subtitle": 8,
        "normal": 6,
        "list paragraph": 0,
    }

    try:
        font_specs = {
            "carlito-regular": {
                "font": fitz.Font(fontfile=document_fonts["carlito-regular"]),
                "file": document_fonts["carlito-regular"],
                "pdf_name": "carlito",
            },
            "carlito-bold": {
                "font": fitz.Font(fontfile=document_fonts["carlito-bold"]),
                "file": document_fonts["carlito-bold"],
                "pdf_name": "carlitobold",
            },
            "liberation-regular": {
                "font": fitz.Font(fontfile=document_fonts["liberation-regular"]),
                "file": document_fonts["liberation-regular"],
                "pdf_name": "liberation",
            },
            "liberation-bold": {
                "font": fitz.Font(fontfile=document_fonts["liberation-bold"]),
                "file": document_fonts["liberation-bold"],
                "pdf_name": "liberationbold",
            },
            "times-regular": {"font": fitz.Font("tiro"), "file": None, "pdf_name": "tiro"},
            "times-bold": {"font": fitz.Font("tibo"), "file": None, "pdf_name": "tibo"},
            "courier-regular": {"font": fitz.Font("cour"), "file": None, "pdf_name": "cour"},
            "courier-bold": {"font": fitz.Font("cobo"), "file": None, "pdf_name": "cobo"},
        }
        cjk_file = document_fonts.get("cjk-regular")
        if cjk_file:
            font_specs["cjk-regular"] = {
                "font": fitz.Font(fontfile=cjk_file),
                "file": cjk_file,
                "pdf_name": "notosans",
            }
    except Exception as error:
        raise RuntimeError("Failed to initialize PDF fonts.") from error

    current_page = None
    current_section = None
    column_index = 0
    column_top = 0
    page_flow_bottom = 0
    y_position = 0
    current_floats = []
    pending_links = []
    bookmark_targets = {}
    toc_entries = []
    previous_style_name = None
    pending_paragraph_after = 0.0

    def get_style_chain(style):
        chain = []
        seen = set()
        while style is not None and id(style._element) not in seen:
            seen.add(id(style._element))
            chain.append(style)
            style = style.base_style
        chain.reverse()
        return chain

    def color_to_tuple(color_format):
        try:
            rgb = color_format.rgb
            if rgb is not None:
                return (rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
        except Exception:
            pass
        return None

    def related_xml_root(relationship_suffix):
        for relationship in doc.part.rels.values():
            if relationship.reltype.endswith(relationship_suffix):
                try:
                    return etree.fromstring(relationship.target_part.blob)
                except Exception:
                    return None
        return None

    theme_root = related_xml_root("/theme")
    theme_fonts = {}
    if theme_root is not None:
        for group_name in ("major", "minor"):
            group = theme_root.find(
                ".//a:fontScheme/a:{}Font".format(group_name), NS
            )
            if group is None:
                continue
            latin = group.find("./a:latin", NS)
            east_asia = group.find("./a:ea", NS)
            complex_script = group.find("./a:cs", NS)
            latin_name = latin.get("typeface", "") if latin is not None else ""
            east_asia_name = east_asia.get("typeface", "") if east_asia is not None else ""
            complex_name = complex_script.get("typeface", "") if complex_script is not None else ""
            theme_fonts.update({
                (group_name + "ascii").lower(): latin_name,
                (group_name + "hansi").lower(): latin_name,
                (group_name + "eastasia").lower(): east_asia_name or latin_name,
                (group_name + "bidi").lower(): complex_name or latin_name,
            })

    font_table_families = {}
    font_table_root = related_xml_root("/fontTable")
    if font_table_root is not None:
        for font_element in font_table_root.findall("./w:font", NS):
            name = _attr(font_element, "name", "")
            family = font_element.find("./w:family", NS)
            if name:
                font_table_families[name.casefold()] = _attr(family, "val", "")

    def resolve_theme_font(theme_name):
        return theme_fonts.get(str(theme_name or "").lower(), "")

    def apply_rfonts(props, rfonts):
        if rfonts is None:
            return
        for key, direct_name, theme_name in (
            ("ascii", "ascii", "asciiTheme"),
            ("hansi", "hAnsi", "hAnsiTheme"),
            ("east_asia", "eastAsia", "eastAsiaTheme"),
            ("complex", "cs", "cstheme"),
        ):
            themed = resolve_theme_font(_attr(rfonts, theme_name))
            direct = _attr(rfonts, direct_name)
            if themed:
                props["font_names"][key] = themed
            if direct:
                props["font_names"][key] = direct

    def apply_rpr_xml(props, rpr):
        if rpr is None:
            return
        apply_rfonts(props, rpr.find("./w:rFonts", NS))
        size = rpr.find("./w:sz", NS)
        if size is not None:
            try:
                props["size"] = int(_attr(size, "val")) / 2
            except (TypeError, ValueError):
                pass
        for element_name, key in (
            ("b", "bold"), ("i", "italic"), ("strike", "strike"),
        ):
            element = rpr.find("./w:{}".format(element_name), NS)
            if element is not None:
                props[key] = _attr(element, "val", "true") not in ("false", "0")
        underline = rpr.find("./w:u", NS)
        if underline is not None:
            props["underline"] = _attr(underline, "val", "single") != "none"
        color = rpr.find("./w:color", NS)
        color_value = _attr(color, "val")
        if color_value and color_value not in ("auto", "none"):
            try:
                props["color"] = tuple(
                    int(color_value[index:index + 2], 16) / 255 for index in (0, 2, 4)
                )
            except (TypeError, ValueError):
                pass

    def apply_font_properties(props, font, rpr=None):
        if font is not None:
            if font.bold is not None:
                props["bold"] = bool(font.bold)
            if font.italic is not None:
                props["italic"] = bool(font.italic)
            if font.underline is not None:
                props["underline"] = bool(font.underline)
            if font.strike is not None:
                props["strike"] = bool(font.strike)
            if font.size is not None:
                props["size"] = float(font.size.pt)
            if font.name:
                props["font_names"]["ascii"] = font.name
                props["font_names"]["hansi"] = font.name
            color = color_to_tuple(font.color)
            if color is not None:
                props["color"] = color
        apply_rpr_xml(props, rpr)

    def copy_text_properties(props):
        copied = props.copy()
        copied["font_names"] = dict(props.get("font_names", {}))
        return copied

    document_default_props = {
        "bold": False,
        "italic": False,
        "underline": False,
        "strike": False,
        "color": (0, 0, 0),
        "size": 11.0,
        "highlight": None,
        "font_names": {},
    }
    default_rpr = doc.styles.element.find(
        "./w:docDefaults/w:rPrDefault/w:rPr", NS
    )
    apply_rpr_xml(document_default_props, default_rpr)

    def get_paragraph_properties(paragraph):
        props = copy_text_properties(document_default_props)
        if paragraph.style is not None:
            for style in get_style_chain(paragraph.style):
                apply_font_properties(
                    props, style.font, style._element.find("./w:rPr", NS)
                )
        return props

    def get_run_properties(run, paragraph_props, is_link=False):
        props = copy_text_properties(paragraph_props)
        if is_link:
            props["color"] = (0, 0, 1)
            props["underline"] = True
        if run.style is not None:
            for style in get_style_chain(run.style):
                apply_font_properties(
                    props, style.font, style._element.find("./w:rPr", NS)
                )

        rpr = run._element.find("./w:rPr", NS)
        apply_font_properties(props, run.font, rpr)
        if rpr is not None:
            highlight = rpr.find("./w:highlight", NS)
            if highlight is not None:
                colors = {
                    "yellow": (1, 1, 0), "green": (0, 1, 0),
                    "cyan": (0, 1, 1), "magenta": (1, 0, 1),
                    "blue": (0, 0, 1), "red": (1, 0, 0),
                    "darkBlue": (0, 0, 0.5), "darkCyan": (0, 0.5, 0.5),
                    "darkGreen": (0, 0.5, 0), "darkMagenta": (0.5, 0, 0.5),
                    "darkRed": (0.5, 0, 0), "darkYellow": (0.5, 0.5, 0),
                    "darkGray": (0.5, 0.5, 0.5), "lightGray": (0.75, 0.75, 0.75),
                }
                props["highlight"] = colors.get(_attr(highlight, "val"))
        return props

    def merge_paragraph_format(result, paragraph_format):
        if paragraph_format is None:
            return
        for key in ("left_indent", "right_indent", "first_line_indent", "space_before", "space_after"):
            value = getattr(paragraph_format, key, None)
            if value is not None:
                result[key] = float(value.pt)
        line_spacing = getattr(paragraph_format, "line_spacing", None)
        if line_spacing is not None:
            if hasattr(line_spacing, "pt"):
                result["line_exact"] = float(line_spacing.pt)
            else:
                try:
                    result["line_factor"] = float(line_spacing)
                    result["line_exact"] = None
                except (TypeError, ValueError):
                    pass
        if getattr(paragraph_format, "page_break_before", None) is not None:
            result["page_break_before"] = bool(paragraph_format.page_break_before)
        alignment = getattr(paragraph_format, "alignment", None)
        if alignment is not None:
            if alignment == WD_ALIGN_PARAGRAPH.CENTER:
                result["alignment"] = 1
            elif alignment == WD_ALIGN_PARAGRAPH.RIGHT:
                result["alignment"] = 2
            elif alignment == WD_ALIGN_PARAGRAPH.JUSTIFY:
                result["alignment"] = 3
            elif alignment == WD_ALIGN_PARAGRAPH.DISTRIBUTE:
                result["alignment"] = 4
            else:
                result["alignment"] = 0

    def merge_paragraph_xml(result, ppr):
        if ppr is None:
            return
        indent = ppr.find("./w:ind", NS)
        if indent is not None:
            left = _attr(indent, "left")
            right = _attr(indent, "right")
            first_line = _attr(indent, "firstLine")
            hanging = _attr(indent, "hanging")
            if left is not None:
                result["left_indent"] = _twips_to_pt(left)
            if right is not None:
                result["right_indent"] = _twips_to_pt(right)
            if first_line is not None:
                result["first_line_indent"] = _twips_to_pt(first_line)
            elif hanging is not None:
                result["first_line_indent"] = -_twips_to_pt(hanging)
        justification = ppr.find("./w:jc", NS)
        if justification is not None:
            value = str(_attr(justification, "val", "left")).lower()
            result["alignment"] = {
                "center": 1,
                "right": 2,
                "end": 2,
                "both": 3,
                "justify": 3,
                "distribute": 4,
                "thaidistribute": 4,
            }.get(value, 0)
        if ppr.find("./w:contextualSpacing", NS) is not None:
            result["contextual"] = True
        spacing = ppr.find("./w:spacing", NS)
        if spacing is not None:
            for xml_name, key in (("before", "space_before"), ("after", "space_after")):
                value = _attr(spacing, xml_name)
                if value is not None:
                    result[key] = _twips_to_pt(value)
            line_value = _attr(spacing, "line")
            line_rule = _attr(spacing, "lineRule", "auto")
            if line_value is not None:
                if line_rule == "auto":
                    result["line_factor"] = max(0.5, int(line_value) / 240)
                    result["line_exact"] = None
                else:
                    result["line_exact"] = _twips_to_pt(line_value)
        if ppr.find("./w:pageBreakBefore", NS) is not None:
            result["page_break_before"] = True

    document_default_layout = {
        "left_indent": 0.0,
        "right_indent": 0.0,
        "first_line_indent": 0.0,
        "space_before": 0.0,
        "space_after": spacing_fallback["normal"],
        "line_factor": 1.15,
        "line_exact": None,
        "page_break_before": False,
        "contextual": False,
        "alignment": 0,
    }
    default_ppr = doc.styles.element.find(
        "./w:docDefaults/w:pPrDefault/w:pPr", NS
    )
    merge_paragraph_xml(document_default_layout, default_ppr)

    def get_paragraph_layout(paragraph, style_name, numbering=None):
        result = dict(document_default_layout)
        if result["space_after"] is None:
            result["space_after"] = spacing_fallback.get(
                style_name.lower(), spacing_fallback["normal"]
            )
        if paragraph.style is not None:
            for style in get_style_chain(paragraph.style):
                merge_paragraph_format(result, style.paragraph_format)
                merge_paragraph_xml(result, style._element.find("./w:pPr", NS))
        if numbering is not None:
            merge_paragraph_xml(result, numbering.get("ppr"))
        merge_paragraph_format(result, paragraph.paragraph_format)
        ppr = paragraph._element.find("./w:pPr", NS)
        merge_paragraph_xml(result, ppr)
        return result

    def get_outline_level(paragraph):
        if paragraph.style is None:
            return None
        result = None
        for style in get_style_chain(paragraph.style):
            outline = style._element.find("./w:pPr/w:outlineLvl", NS)
            if outline is not None:
                try:
                    result = int(_attr(outline, "val"))
                except (TypeError, ValueError):
                    pass
        return result

    def parse_section(sectpr, fallback=None):
        base = dict(fallback or {})
        base.setdefault("page_width", 612.0)
        base.setdefault("page_height", 792.0)
        base.setdefault("margin_left", 72.0)
        base.setdefault("margin_right", 72.0)
        base.setdefault("margin_top", 72.0)
        base.setdefault("margin_bottom", 72.0)
        base.setdefault("columns", None)
        base.setdefault("column_gap", 36.0)
        base.setdefault("break_type", "nextPage")
        if sectpr is None:
            return base

        page_size = sectpr.find("./w:pgSz", NS)
        if page_size is not None:
            base["page_width"] = _twips_to_pt(_attr(page_size, "w"), base["page_width"])
            base["page_height"] = _twips_to_pt(_attr(page_size, "h"), base["page_height"])
        page_margin = sectpr.find("./w:pgMar", NS)
        if page_margin is not None:
            for xml_name, key in (("left", "margin_left"), ("right", "margin_right"),
                                  ("top", "margin_top"), ("bottom", "margin_bottom")):
                base[key] = _twips_to_pt(_attr(page_margin, xml_name), base[key])
        section_type = sectpr.find("./w:type", NS)
        if section_type is not None:
            base["break_type"] = _attr(section_type, "val", "nextPage")

        cols = sectpr.find("./w:cols", NS)
        available = base["page_width"] - base["margin_left"] - base["margin_right"]
        if cols is not None:
            gap = _twips_to_pt(_attr(cols, "space"), 36.0)
            count = max(1, int(_attr(cols, "num", "1")))
            explicit = []
            for col in cols.findall("./w:col", NS):
                explicit.append({
                    "width": _twips_to_pt(_attr(col, "w")),
                    "space": _twips_to_pt(_attr(col, "space"), gap),
                })
            if explicit:
                base["columns"] = explicit
            else:
                width = max(1, (available - gap * (count - 1)) / count)
                base["columns"] = [
                    {"width": width, "space": gap if index < count - 1 else 0}
                    for index in range(count)
                ]
            base["column_gap"] = gap
        if not base.get("columns"):
            base["columns"] = [{"width": available, "space": 0}]
        return base

    body = doc.element.body
    body_sectpr = body.find("./w:sectPr", NS)
    boundary_sections = []
    for body_element in body:
        if body_element.tag == W + "p":
            paragraph_sectpr = body_element.find("./w:pPr/w:sectPr", NS)
            if paragraph_sectpr is not None:
                boundary_sections.append((body_element, paragraph_sectpr))

    section_nodes = [item[1] for item in boundary_sections]
    if body_sectpr is not None:
        section_nodes.append(body_sectpr)
    if not section_nodes:
        section_nodes.append(None)
    section_specs = []
    fallback_section = None
    for node in section_nodes:
        fallback_section = parse_section(node, fallback_section)
        section_specs.append(fallback_section)
    boundary_ids = {id(item[0]) for item in boundary_sections}
    section_cursor = 0
    current_section = section_specs[0]

    def column_geometry(index=None):
        idx = column_index if index is None else index
        x = current_section["margin_left"]
        columns = current_section["columns"]
        for prior in columns[:idx]:
            x += prior["width"] + prior.get("space", current_section["column_gap"])
        return x, columns[idx]["width"]

    def flow_bottom():
        return page_flow_bottom

    def new_page():
        nonlocal current_page, y_position, column_index, column_top, current_floats
        nonlocal page_flow_bottom, pending_paragraph_after
        current_page = pdf.new_page(
            width=current_section["page_width"],
            height=current_section["page_height"],
        )
        column_index = 0
        column_top = current_section["margin_top"]
        page_flow_bottom = current_section["page_height"] - current_section["margin_bottom"]
        y_position = column_top
        current_floats = []
        pending_paragraph_after = 0.0
        return current_page

    def advance_flow(force_page=False):
        nonlocal column_index, y_position, current_floats, pending_paragraph_after
        if current_page is None:
            new_page()
            return
        if not force_page and column_index + 1 < len(current_section["columns"]):
            column_index += 1
            y_position = column_top
            current_floats = [item for item in current_floats if item["page"] == current_page.number]
            pending_paragraph_after = 0.0
            return
        new_page()

    def ensure_space(height):
        if current_page is None:
            new_page()
        if y_position + height > flow_bottom():
            advance_flow()

    def apply_section(spec):
        nonlocal current_section, column_index, column_top, y_position, current_floats
        old = current_section
        current_section = spec
        same_page_size = (
            current_page is not None
            and abs(current_page.rect.width - spec["page_width"]) < 0.1
            and abs(current_page.rect.height - spec["page_height"]) < 0.1
        )
        if spec.get("break_type") != "continuous" or not same_page_size:
            new_page()
            return
        column_index = 0
        column_top = max(spec["margin_top"], y_position)
        y_position = column_top
        current_floats = []

    def is_cjk_character(char):
        codepoint = ord(char)
        return (
            0x2E80 <= codepoint <= 0x2FFF
            or 0x3040 <= codepoint <= 0x30FF
            or 0x31F0 <= codepoint <= 0x31FF
            or 0x3400 <= codepoint <= 0x4DBF
            or 0x4E00 <= codepoint <= 0x9FFF
            or 0xAC00 <= codepoint <= 0xD7AF
            or 0xF900 <= codepoint <= 0xFAFF
            or 0x20000 <= codepoint <= 0x2FA1F
        )

    def is_complex_character(char):
        codepoint = ord(char)
        return 0x0590 <= codepoint <= 0x08FF or 0xFB1D <= codepoint <= 0xFEFC

    def requested_font_name(char, props):
        names = props.get("font_names", {})
        if is_cjk_character(char):
            return names.get("east_asia") or names.get("hansi") or names.get("ascii") or ""
        if is_complex_character(char):
            return names.get("complex") or names.get("hansi") or names.get("ascii") or ""
        if ord(char) <= 0x7F:
            return names.get("ascii") or names.get("hansi") or ""
        return names.get("hansi") or names.get("ascii") or ""

    def normalized_font_name(name):
        return re.sub(r"[^a-z0-9]", "", str(name or "").casefold())

    def mapped_font_family(name, char):
        if is_cjk_character(char):
            return "cjk"
        candidates = [part.strip() for part in re.split(r"[;,]", str(name or "")) if part.strip()]
        for candidate in candidates or [str(name or "")]:
            normalized = normalized_font_name(candidate)
            if normalized in {"calibri", "carlito"}:
                return "carlito"
            if normalized == "dejavusans":
                return "cjk"
            if normalized in {
                "arial", "helvetica", "tahoma", "verdana", "liberationsans",
                "freesans", "microsoftsansserif", "sans", "sansserif",
            }:
                return "liberation"
            if normalized in {
                "times", "timesnewroman", "cambria", "georgia", "liberationserif",
                "dejavuserif", "freeserif", "serif",
            }:
                return "times"
            if normalized in {
                "courier", "couriernew", "consolas", "liberationmono", "dejavusansmono",
                "freemono", "monospace",
            }:
                return "courier"
            if any(token in normalized for token in (
                "simsun", "simhei", "notosanscjk", "notosanssc", "yahei",
                "heiti", "songti", "kaiti", "fangsong", "pingfang",
            )):
                return "cjk"

        family = ""
        for candidate in candidates or [str(name or "")]:
            family = font_table_families.get(candidate.casefold(), "")
            if family:
                break
        if family == "roman":
            return "times"
        if family == "modern":
            return "courier"
        if family in ("swiss", "system"):
            return "liberation"
        return "carlito"

    def font_kind_for_char(char, props):
        bold = bool(props.get("bold"))
        family = mapped_font_family(requested_font_name(char, props), char)
        suffix = "bold" if bold else "regular"
        kind = family + "-" + suffix
        if family == "cjk":
            kind = "cjk-regular"

        codepoint = ord(char)
        spec = font_specs.get(kind)
        if spec is not None and (codepoint <= 0xFF or spec["file"] is not None):
            try:
                if spec["font"].has_glyph(codepoint):
                    return kind
            except Exception:
                pass

        for fallback_kind in (
            "carlito-" + suffix,
            "liberation-" + suffix,
            "cjk-regular",
        ):
            fallback = font_specs.get(fallback_kind)
            if fallback is None:
                continue
            try:
                if fallback["font"].has_glyph(codepoint):
                    return fallback_kind
            except Exception:
                continue
        return "carlito-" + suffix

    def split_font_runs(text, props, link=None):
        text = str(text or "").replace("\u0000", "")
        if not text:
            return []
        pieces = []
        buffer = text[0]
        kind = font_kind_for_char(text[0], props)
        for char in text[1:]:
            next_kind = font_kind_for_char(char, props)
            if next_kind == kind:
                buffer += char
            else:
                pieces.append({"text": buffer, "props": props, "link": link, "font_kind": kind})
                buffer = char
                kind = next_kind
        pieces.append({"text": buffer, "props": props, "link": link, "font_kind": kind})
        return pieces

    def measure_piece(text, props, font_kind):
        font = font_specs[font_kind]["font"]
        if font is not None:
            try:
                return font.text_length(str(text or ""), fontsize=props["size"])
            except Exception:
                pass
        return sum(props["size"] if ord(char) > 255 else props["size"] * 0.5 for char in str(text or ""))

    def piece_vertical_metrics(piece):
        fontsize = piece["props"]["size"]
        font = font_specs[piece["font_kind"]]["font"]
        try:
            ascent = max(0.0, float(font.ascender)) * fontsize
            descent = max(0.0, -float(font.descender)) * fontsize
        except Exception:
            ascent = fontsize
            descent = fontsize * 0.2
        if ascent + descent <= 0:
            return fontsize, fontsize * 0.2
        return ascent, descent

    def line_vertical_metrics(pieces, layout):
        metrics = [piece_vertical_metrics(piece) for piece in pieces]
        max_ascent = max([value[0] for value in metrics] or [11.0])
        max_descent = max([value[1] for value in metrics] or [2.2])
        natural_height = max_ascent + max_descent
        line_height = layout["line_exact"] or natural_height * layout["line_factor"]
        return max_ascent, max_descent, max(1.0, line_height)

    def atomize_segments(segments):
        atoms = []
        for segment in segments:
            for font_piece in split_font_runs(segment.get("text"), segment["props"], segment.get("link")):
                for token in re.findall(r"\n|[^\S\n]+|[^\s]+", font_piece["text"]):
                    atom = dict(font_piece)
                    atom["text"] = token.replace("\t", "    ")
                    atom["width"] = measure_piece(atom["text"], atom["props"], atom["font_kind"])
                    atoms.append(atom)
        return atoms

    def append_line_piece(line, atom):
        if not atom.get("text"):
            return
        if (line and line[-1]["props"] == atom["props"] and line[-1].get("link") == atom.get("link")
                and line[-1]["font_kind"] == atom["font_kind"]
                and not line[-1]["text"].isspace() and not atom["text"].isspace()):
            line[-1]["text"] += atom["text"]
            line[-1]["width"] += atom["width"]
        else:
            line.append(dict(atom))

    def line_box(base_x, max_width, top, height):
        intervals = [(base_x, base_x + max_width)]
        blockers = []
        for floating in current_floats:
            if floating["page"] != current_page.number:
                continue
            rect = floating["wrap_rect"]
            if rect.y1 <= top or rect.y0 >= top + height:
                continue
            blockers.append(rect)
            next_intervals = []
            for start, end in intervals:
                if rect.x1 <= start or rect.x0 >= end:
                    next_intervals.append((start, end))
                    continue
                if rect.x0 > start:
                    next_intervals.append((start, min(end, rect.x0)))
                if rect.x1 < end:
                    next_intervals.append((max(start, rect.x1), end))
            intervals = next_intervals
        intervals = [(start, end) for start, end in intervals if end - start >= 18]
        if intervals:
            start, end = max(intervals, key=lambda value: value[1] - value[0])
            return start, end - start, None
        next_y = min((rect.y1 for rect in blockers if rect.y1 > top), default=None)
        return base_x, max_width, next_y

    def draw_piece(page, x, baseline, piece, line_top, line_height):
        props = piece["props"]
        fontsize = props["size"]
        width = piece["width"]
        color = props["color"]
        if props.get("highlight"):
            rect = fitz.Rect(x, baseline - fontsize - 2, x + width, baseline + 2)
            page.draw_rect(rect, color=props["highlight"], fill=props["highlight"])

        spec = font_specs[piece["font_kind"]]
        options = {
            "fontsize": fontsize,
            "fontname": spec["pdf_name"],
            "color": color,
        }
        if spec["file"]:
            options["fontfile"] = spec["file"]
        if piece["font_kind"] == "cjk-regular" and props.get("bold"):
            options.update({
                "fill": color,
                "render_mode": 2,
                "border_width": max(0.035, min(0.08, fontsize * 0.004)),
            })
        page.insert_text((x, baseline), piece["text"], **options)

        if props.get("underline"):
            page.draw_line((x, baseline + 1.5), (x + width, baseline + 1.5), color=color, width=0.5)
        if props.get("strike"):
            strike_y = baseline - fontsize * 0.35
            page.draw_line((x, strike_y), (x + width, strike_y), color=color, width=0.5)
        if piece.get("link") and width > 0:
            pending_links.append({
                "page": page.number,
                "rect": (x, line_top, x + width, line_top + line_height),
                "target": piece["link"],
            })

    def split_oversize_atom(atom, width):
        chunks = []
        current = ""
        current_width = 0
        for char in atom["text"]:
            char_width = measure_piece(char, atom["props"], atom["font_kind"])
            if current and current_width + char_width > width:
                item = dict(atom)
                item["text"] = current
                item["width"] = current_width
                chunks.append(item)
                current = char
                current_width = char_width
            else:
                current += char
                current_width += char_width
        if current:
            item = dict(atom)
            item["text"] = current
            item["width"] = current_width
            chunks.append(item)
        return chunks

    def render_segments(segments, base_x, max_width, layout, alignment=0, marker=None,
                        bookmark_names=None, outline=None, first_line_x=None):
        nonlocal y_position
        atoms = atomize_segments(segments)
        if not atoms:
            return False
        _, _, default_line_height = line_vertical_metrics(atoms, layout)
        first_line = True
        outline_recorded = False
        initial_column_x, initial_column_width = column_geometry()
        base_offset = base_x - initial_column_x
        first_offset = (base_x if first_line_x is None else first_line_x) - initial_column_x
        right_offset = max(0, initial_column_width - base_offset - max_width)

        while atoms:
            ensure_space(default_line_height)
            active_column_x, active_column_width = column_geometry()
            active_offset = first_offset if first_line else base_offset
            active_base_x = active_column_x + active_offset
            active_max_width = max(18, active_column_width - active_offset - right_offset)
            line_x, line_width, retry_y = line_box(
                active_base_x, active_max_width, y_position, default_line_height
            )
            if retry_y is not None:
                y_position = retry_y
                ensure_space(default_line_height)
                continue

            line = []
            used = 0
            explicit_break = False
            while atoms:
                atom = atoms[0]
                if atom["text"] == "\n":
                    atoms.pop(0)
                    explicit_break = True
                    break
                if atom["text"].isspace() and not line:
                    atoms.pop(0)
                    continue
                if atom["width"] <= line_width - used + 0.01:
                    append_line_piece(line, atom)
                    used += atom["width"]
                    atoms.pop(0)
                    continue
                if (line and atom["text"] and all(char in ".,;:!?)]}>，。！？；：）》】」』、" for char in atom["text"])
                        and atom["width"] <= max(5, atom["props"]["size"] * 0.7)):
                    append_line_piece(line, atom)
                    used += atom["width"]
                    atoms.pop(0)
                    continue
                if line:
                    break
                chunks = split_oversize_atom(atom, line_width)
                atoms.pop(0)
                if chunks:
                    append_line_piece(line, chunks[0])
                    used += chunks[0]["width"]
                    atoms[0:0] = chunks[1:]
                break

            while line and line[-1]["text"].isspace():
                used -= line[-1]["width"]
                line.pop()

            if not line:
                y_position += default_line_height
                first_line = False
                continue
            line_ascent, _, line_height = line_vertical_metrics(line, layout)
            if y_position + line_height > flow_bottom():
                advance_flow()
                continue

            actual_x = line_x
            if alignment == 1:
                actual_x += max(0, (line_width - used) / 2)
            elif alignment == 2:
                actual_x += max(0, line_width - used)
            extra_gap = 0.0
            gap_after_every_piece = False
            if alignment == 3 and atoms and not explicit_break:
                gaps = sum(1 for piece in line if piece["text"].isspace())
                if gaps:
                    extra_gap = max(0.0, line_width - used) / gaps
            elif alignment == 4 and line_width > used:
                expanded = []
                for piece in line:
                    if piece["text"].isspace() or len(piece["text"]) <= 1:
                        expanded.append(piece)
                        continue
                    for char in piece["text"]:
                        item = dict(piece)
                        item["text"] = char
                        item["width"] = measure_piece(char, item["props"], item["font_kind"])
                        expanded.append(item)
                line = expanded
                if len(line) > 1:
                    extra_gap = max(0.0, line_width - used) / (len(line) - 1)
                    gap_after_every_piece = True
            baseline = y_position + line_ascent

            if first_line and marker:
                marker_props = marker["props"]
                marker_x = marker["x"]
                for marker_piece in split_font_runs(marker["text"], marker_props):
                    marker_piece["width"] = measure_piece(
                        marker_piece["text"], marker_props, marker_piece["font_kind"]
                    )
                    draw_piece(
                        current_page, marker_x, baseline, marker_piece, y_position, line_height
                    )
                    marker_x += marker_piece["width"]

            if first_line:
                if bookmark_names:
                    for name in bookmark_names:
                        bookmark_targets[name] = (current_page.number, actual_x, y_position)
                    bookmark_names.clear()
                if outline and not outline_recorded:
                    toc_entries.append([outline["level"] + 1, outline["title"], current_page.number + 1, y_position])
                    outline_recorded = True

            cursor_x = actual_x
            for piece_index, piece in enumerate(line):
                draw_piece(current_page, cursor_x, baseline, piece, y_position, line_height)
                cursor_x += piece["width"]
                if piece["text"].isspace() or (gap_after_every_piece and piece_index < len(line) - 1):
                    cursor_x += extra_gap
            y_position += line_height
            first_line = False
        return True

    def fixed_lines(segments, max_width):
        atoms = atomize_segments(segments)
        lines = []
        line = []
        used = 0
        while atoms:
            atom = atoms.pop(0)
            if atom["text"] == "\n":
                lines.append(line)
                line = []
                used = 0
                continue
            if atom["text"].isspace() and not line:
                continue
            if atom["width"] <= max_width - used + 0.01:
                append_line_piece(line, atom)
                used += atom["width"]
                continue
            if line:
                lines.append(line)
                line = []
                used = 0
                atoms.insert(0, atom)
                continue
            chunks = split_oversize_atom(atom, max_width)
            if chunks:
                append_line_piece(line, chunks[0])
                used = chunks[0]["width"]
                atoms[0:0] = chunks[1:]
        if line or not lines:
            lines.append(line)
        return lines

    def build_numbering():
        abstract_levels = {}
        num_map = {}
        try:
            root = doc.part.numbering_part.element
        except Exception:
            return abstract_levels, num_map
        for abstract in root.findall("./w:abstractNum", NS):
            abstract_id = _attr(abstract, "abstractNumId")
            levels = {}
            for lvl in abstract.findall("./w:lvl", NS):
                level = int(_attr(lvl, "ilvl", "0"))
                num_fmt = lvl.find("./w:numFmt", NS)
                lvl_text = lvl.find("./w:lvlText", NS)
                start = lvl.find("./w:start", NS)
                ppr = lvl.find("./w:pPr", NS)
                ind = ppr.find("./w:ind", NS) if ppr is not None else None
                levels[level] = {
                    "format": _attr(num_fmt, "val", "decimal"),
                    "text": _attr(lvl_text, "val", "%{}".format(level + 1)),
                    "start": int(_attr(start, "val", "1")),
                    "left": _twips_to_pt(_attr(ind, "left"), 18 * (level + 1)),
                    "hanging": _twips_to_pt(_attr(ind, "hanging"), 18),
                    "first_line": _twips_to_pt(_attr(ind, "firstLine"), 0),
                    "ppr": ppr,
                }
            abstract_levels[abstract_id] = levels
        for num in root.findall("./w:num", NS):
            num_id = _attr(num, "numId")
            abstract = num.find("./w:abstractNumId", NS)
            overrides = {}
            for override in num.findall("./w:lvlOverride", NS):
                level = int(_attr(override, "ilvl", "0"))
                start_override = override.find("./w:startOverride", NS)
                if start_override is not None:
                    overrides[level] = int(_attr(start_override, "val", "1"))
            num_map[num_id] = {"abstract": _attr(abstract, "val"), "overrides": overrides}
        return abstract_levels, num_map

    abstract_levels, numbering_map = build_numbering()
    list_counters = {}

    def format_counter(value, number_format):
        if number_format == "lowerLetter":
            return _alpha_number(value, False)
        if number_format == "upperLetter":
            return _alpha_number(value, True)
        if number_format == "lowerRoman":
            return _roman_number(value, False)
        if number_format == "upperRoman":
            return _roman_number(value, True)
        return str(value)

    def get_numbering_info(paragraph, paragraph_props):
        num_id = None
        level = 0
        property_nodes = [default_ppr]
        if paragraph.style is not None:
            property_nodes.extend(
                style._element.find("./w:pPr", NS)
                for style in get_style_chain(paragraph.style)
            )
        property_nodes.append(paragraph._element.find("./w:pPr", NS))
        for ppr in property_nodes:
            numpr = ppr.find("./w:numPr", NS) if ppr is not None else None
            if numpr is None:
                continue
            numid = numpr.find("./w:numId", NS)
            ilvl = numpr.find("./w:ilvl", NS)
            if numid is not None:
                num_id = _attr(numid, "val")
            if ilvl is not None:
                level = int(_attr(ilvl, "val", "0"))
        if num_id in (None, "0"):
            return None
        mapping = numbering_map.get(num_id)
        if not mapping:
            return None
        level_info = abstract_levels.get(mapping["abstract"], {}).get(level)
        if not level_info:
            return None

        number_format = level_info["format"]
        text = level_info["text"] if number_format != "none" else ""
        if number_format != "none":
            key = (num_id, level)
            if key not in list_counters:
                list_counters[key] = mapping["overrides"].get(level, level_info["start"]) - 1
            list_counters[key] += 1
            for counter_key in list(list_counters):
                if counter_key[0] == num_id and counter_key[1] > level:
                    del list_counters[counter_key]

        if number_format == "bullet":
            text = _normalize_numbering_text(text)
        elif number_format != "none":
            for number_level in range(9):
                token = "%{}".format(number_level + 1)
                if token not in text:
                    continue
                number_key = (num_id, number_level)
                number_value = list_counters.get(number_key, 1)
                referenced = abstract_levels.get(mapping["abstract"], {}).get(number_level, level_info)
                text = text.replace(token, format_counter(number_value, referenced["format"]))
        return {
            "text": text,
            "left": level_info["left"],
            "hanging": level_info["hanging"],
            "first_line": level_info["first_line"],
            "props": copy_text_properties(paragraph_props),
            "ppr": level_info.get("ppr"),
        }

    def collect_bookmarks(paragraph):
        names = []
        for bookmark in paragraph._element.findall(".//w:bookmarkStart", NS):
            name = _attr(bookmark, "name")
            if name:
                names.append(name)
        return names

    def paragraph_segments(paragraph):
        segments = []
        paragraph_props = get_paragraph_properties(paragraph)
        for content_item in paragraph.iter_inner_content():
            if isinstance(content_item, Hyperlink):
                link_target = {"uri": content_item.url or "", "fragment": content_item.fragment or ""}
                runs = content_item.runs
                is_link = True
            else:
                link_target = None
                runs = [content_item]
                is_link = False
            for run in runs:
                if run.text:
                    segments.append({
                        "text": run.text,
                        "props": get_run_properties(run, paragraph_props, is_link),
                        "link": link_target,
                    })
        return segments

    CHART_PALETTE = [
        (0.0, 0.271, 0.525), (1.0, 0.259, 0.055), (1.0, 0.827, 0.125),
        (0.341, 0.612, 0.839), (0.576, 0.322, 0.624), (0.38, 0.627, 0.192),
        (0.945, 0.545, 0.153), (0.651, 0.651, 0.651),
    ]
    CHART_SCHEME_COLORS = {
        "accent1": CHART_PALETTE[0], "accent2": CHART_PALETTE[1],
        "accent3": CHART_PALETTE[2], "accent4": CHART_PALETTE[3],
        "accent5": CHART_PALETTE[4], "accent6": CHART_PALETTE[5],
        "dk1": (0, 0, 0), "lt1": (1, 1, 1),
        "dk2": (0.267, 0.267, 0.267), "lt2": (0.933, 0.933, 0.933),
    }

    def chart_attr(element, name, default=None):
        if element is None:
            return default
        return element.get(name, element.get("{" + C_NS + "}" + name, default))

    def chart_bool(parent, path, default=False):
        element = parent.find(path, NS) if parent is not None else None
        if element is None:
            return default
        return str(chart_attr(element, "val", "1")).lower() not in ("0", "false", "off")

    def chart_color(element, fallback_index=0):
        solid = element.find("./c:spPr/a:solidFill", NS) if element is not None else None
        if solid is not None:
            rgb = solid.find("./a:srgbClr", NS)
            value = rgb.get("val") if rgb is not None else None
            if value and len(value) == 6:
                try:
                    return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4))
                except ValueError:
                    pass
            scheme = solid.find("./a:schemeClr", NS)
            if scheme is not None:
                return CHART_SCHEME_COLORS.get(scheme.get("val"), CHART_PALETTE[fallback_index % len(CHART_PALETTE)])
        return CHART_PALETTE[fallback_index % len(CHART_PALETTE)]

    def chart_cached_values(parent):
        if parent is None:
            return []
        cache = None
        for path in (
            ".//c:strCache", ".//c:numCache", ".//c:strLit", ".//c:numLit",
        ):
            cache = parent.find(path, NS)
            if cache is not None:
                break
        if cache is None:
            multi = parent.find(".//c:multiLvlStrCache", NS)
            levels = multi.findall("./c:lvl", NS) if multi is not None else []
            cache = levels[-1] if levels else None
        if cache is None:
            return []
        points = []
        for point in cache.findall("./c:pt", NS):
            value = point.find("./c:v", NS)
            try:
                index = int(chart_attr(point, "idx", len(points)))
            except (TypeError, ValueError):
                index = len(points)
            points.append((index, value.text if value is not None and value.text is not None else ""))
        return [value for _, value in sorted(points)]

    def chart_series_title(series, index):
        direct = series.find("./c:tx/c:v", NS)
        if direct is not None and direct.text:
            return direct.text
        cached = chart_cached_values(series.find("./c:tx", NS))
        return cached[0] if cached else "Series {}".format(index + 1)

    def parse_chart(chart_root):
        plot_area = chart_root.find("./c:chart/c:plotArea", NS)
        if plot_area is None:
            return None
        type_element = None
        chart_type = None
        for candidate in ("barChart", "lineChart", "pieChart", "doughnutChart"):
            element = plot_area.find("./c:{}".format(candidate), NS)
            if element is not None:
                chart_type = candidate
                type_element = element
                break
        if type_element is None:
            return None

        series_output = []
        categories = []
        for index, series in enumerate(type_element.findall("./c:ser", NS)):
            category_values = chart_cached_values(series.find("./c:cat", NS))
            if len(category_values) > len(categories):
                categories = category_values
            raw_values = chart_cached_values(series.find("./c:val", NS))
            values = []
            for value in raw_values:
                try:
                    values.append(float(value))
                except (TypeError, ValueError):
                    values.append(0.0)
            point_colors = {}
            for point in series.findall("./c:dPt", NS):
                try:
                    point_index = int(chart_attr(point.find("./c:idx", NS), "val", "0"))
                except (TypeError, ValueError):
                    continue
                point_colors[point_index] = chart_color(point, point_index)
            series_output.append({
                "name": chart_series_title(series, index),
                "values": values,
                "color": chart_color(series, index),
                "point_colors": point_colors,
                "marker": chart_attr(series.find("./c:marker/c:symbol", NS), "val", "circle"),
            })

        if not series_output or not any(item["values"] for item in series_output):
            return None
        value_count = max(len(item["values"]) for item in series_output)
        if not categories:
            categories = [str(index + 1) for index in range(value_count)]
        elif len(categories) < value_count:
            categories.extend(str(index + 1) for index in range(len(categories), value_count))

        title_parts = [
            node.text for node in chart_root.findall("./c:chart/c:title//a:t", NS)
            if node.text
        ]
        if not title_parts:
            title_parts = chart_cached_values(chart_root.find("./c:chart/c:title", NS))
        legend = chart_root.find("./c:chart/c:legend", NS)
        legend_pos = chart_attr(legend.find("./c:legendPos", NS), "val", "r") if legend is not None else None
        grouping = chart_attr(type_element.find("./c:grouping", NS), "val", "clustered")
        bar_direction = chart_attr(type_element.find("./c:barDir", NS), "val", "col")
        data_labels = type_element.find("./c:dLbls", NS)
        value_axis = plot_area.find("./c:valAx", NS)

        def axis_number(path):
            element = value_axis.find(path, NS) if value_axis is not None else None
            try:
                return float(chart_attr(element, "val")) if element is not None else None
            except (TypeError, ValueError):
                return None

        return {
            "type": chart_type,
            "element": type_element,
            "series": series_output,
            "categories": categories,
            "title": "".join(title_parts),
            "legend": legend_pos,
            "grouping": grouping,
            "bar_direction": bar_direction,
            "axis_min": axis_number("./c:scaling/c:min"),
            "axis_max": axis_number("./c:scaling/c:max"),
            "major_unit": axis_number("./c:majorUnit"),
            "show_value": chart_bool(data_labels, "./c:showVal"),
            "show_category": chart_bool(data_labels, "./c:showCatName"),
            "show_series": chart_bool(data_labels, "./c:showSerName"),
            "show_percent": chart_bool(data_labels, "./c:showPercent"),
            "vary_colors": chart_bool(type_element, "./c:varyColors"),
            "hole_size": int(chart_attr(type_element.find("./c:holeSize", NS), "val", "50")) if chart_type == "doughnutChart" else 0,
        }

    def chart_text_width(text, size=7, bold=False):
        props = copy_text_properties(document_default_props)
        props.update({"size": size, "bold": bold, "color": (0, 0, 0)})
        return sum(measure_piece(piece["text"], props, piece["font_kind"])
                   for piece in split_font_runs(str(text or ""), props))

    def draw_chart_text(page, text, x, top, size=7, color=(0, 0, 0), align="left",
                        max_width=None, bold=False):
        text = str(text or "")
        props = copy_text_properties(document_default_props)
        props.update({"size": size, "bold": bold, "color": color})
        pieces = split_font_runs(text, props)
        for piece in pieces:
            piece["width"] = measure_piece(piece["text"], props, piece["font_kind"])
        width = sum(piece["width"] for piece in pieces)
        if max_width is not None and width > max_width:
            shortened = text
            while shortened and chart_text_width(shortened + "...", size, bold) > max_width:
                shortened = shortened[:-1]
            return draw_chart_text(page, shortened + "...", x, top, size, color, align, None, bold)
        cursor = x
        if align == "center":
            cursor -= width / 2
        elif align == "right":
            cursor -= width
        baseline = top + size
        for piece in pieces:
            draw_piece(page, cursor, baseline, piece, top, size * 1.2)
            cursor += piece["width"]
        return width

    def nice_axis(chart):
        values = [value for series in chart["series"] for value in series["values"]]
        if chart["grouping"] in ("stacked", "percentStacked"):
            count = max((len(item["values"]) for item in chart["series"]), default=0)
            positives = []
            negatives = []
            for index in range(count):
                positives.append(sum(max(0, item["values"][index] if index < len(item["values"]) else 0) for item in chart["series"]))
                negatives.append(sum(min(0, item["values"][index] if index < len(item["values"]) else 0) for item in chart["series"]))
            values = positives + negatives
        if chart["grouping"] == "percentStacked":
            return 0.0, 100.0, 20.0
        minimum = chart["axis_min"] if chart["axis_min"] is not None else min([0.0] + values)
        maximum = chart["axis_max"] if chart["axis_max"] is not None else max([0.0] + values)
        if maximum <= minimum:
            maximum = minimum + 1
        if chart["major_unit"]:
            step = chart["major_unit"]
        else:
            rough = (maximum - minimum) / 5
            power = 10 ** math.floor(math.log10(max(rough, 1e-9)))
            normalized = rough / power
            step = (1 if normalized <= 1 else 2 if normalized <= 2 else 5 if normalized <= 5 else 10) * power
        if chart["axis_min"] is None:
            minimum = math.floor(minimum / step) * step
        if chart["axis_max"] is None:
            maximum = math.ceil(maximum / step) * step
            if values and max(values) > 0 and max(values) >= maximum * 0.9:
                maximum += step
        return minimum, maximum, step

    def chart_point_color(chart, series_index, point_index):
        series = chart["series"][series_index]
        if point_index in series["point_colors"]:
            return series["point_colors"][point_index]
        if chart["vary_colors"] and len(chart["series"]) == 1:
            return CHART_PALETTE[point_index % len(CHART_PALETTE)]
        return series["color"]

    def draw_chart_legend(page, chart, rect):
        if not chart["legend"]:
            return
        entries = [(item["name"], item["color"]) for item in chart["series"]]
        if chart["type"] in ("pieChart", "doughnutChart") and len(chart["series"]) == 1:
            entries = [(name, chart_point_color(chart, 0, index)) for index, name in enumerate(chart["categories"])]
        horizontal = chart["legend"] in ("t", "b")
        if horizontal:
            total_width = sum(12 + chart_text_width(name, 7) for name, _ in entries)
            cursor_x = rect.x0 + max(0, (rect.width - total_width) / 2)
            cursor_y = rect.y0 + 2
            for name, color in entries:
                page.draw_rect(fitz.Rect(cursor_x, cursor_y + 2, cursor_x + 6, cursor_y + 8), color=color, fill=color, width=0.4)
                draw_chart_text(page, name, cursor_x + 9, cursor_y, 7)
                cursor_x += 12 + chart_text_width(name, 7)
        else:
            cursor_y = rect.y0 + max(0, (rect.height - len(entries) * 13) / 2)
            for name, color in entries:
                page.draw_rect(fitz.Rect(rect.x0 + 2, cursor_y + 2, rect.x0 + 8, cursor_y + 8), color=color, fill=color, width=0.4)
                draw_chart_text(page, name, rect.x0 + 11, cursor_y, 7, max_width=max(10, rect.width - 12))
                cursor_y += 13

    def chart_plot_and_legend_rects(chart, rect):
        content = fitz.Rect(rect.x0 + 5, rect.y0 + 5, rect.x1 - 5, rect.y1 - 5)
        if chart["title"]:
            content.y0 += 15
        legend_rect = None
        position = chart["legend"]
        if position == "r":
            width = min(82, content.width * 0.3)
            legend_rect = fitz.Rect(content.x1 - width, content.y0, content.x1, content.y1)
            content.x1 -= width
        elif position == "l":
            width = min(82, content.width * 0.3)
            legend_rect = fitz.Rect(content.x0, content.y0, content.x0 + width, content.y1)
            content.x0 += width
        elif position == "t":
            legend_rect = fitz.Rect(content.x0, content.y0, content.x1, content.y0 + 15)
            content.y0 += 15
        elif position == "b":
            legend_rect = fitz.Rect(content.x0, content.y1 - 15, content.x1, content.y1)
            content.y1 -= 15
        return content, legend_rect

    def draw_cartesian_axes(page, chart, rect, horizontal=False):
        minimum, maximum, step = nice_axis(chart)
        if horizontal:
            plot = fitz.Rect(rect.x0 + 42, rect.y0 + 5, rect.x1 - 5, rect.y1 - 16)
        else:
            plot = fitz.Rect(rect.x0 + 24, rect.y0 + 5, rect.x1 - 5, rect.y1 - 18)
        axis_color = (0.7, 0.7, 0.7)
        tick = minimum
        while tick <= maximum + step * 0.01:
            ratio = (tick - minimum) / (maximum - minimum)
            label = "{:g}".format(tick)
            if horizontal:
                position = plot.x0 + ratio * plot.width
                page.draw_line((position, plot.y0), (position, plot.y1), color=axis_color, width=0.45)
                draw_chart_text(page, label, position, plot.y1 + 3, 7, align="center")
            else:
                position = plot.y1 - ratio * plot.height
                page.draw_line((plot.x0, position), (plot.x1, position), color=axis_color, width=0.45)
                draw_chart_text(page, label, plot.x0 - 4, position - 4, 7, align="right")
            tick += step
        page.draw_line((plot.x0, plot.y1), (plot.x1, plot.y1), color=axis_color, width=0.6)
        page.draw_line((plot.x0, plot.y0), (plot.x0, plot.y1), color=axis_color, width=0.6)
        return plot, minimum, maximum

    def draw_bar_chart(page, chart, rect):
        horizontal = chart["bar_direction"] == "bar"
        plot, minimum, maximum = draw_cartesian_axes(page, chart, rect, horizontal)
        categories = chart["categories"]
        series_count = max(1, len(chart["series"]))
        category_count = max(1, len(categories))
        grouping = chart["grouping"]

        for category_index, category in enumerate(categories):
            if horizontal:
                slot = plot.height / category_count
                center = plot.y0 + slot * (category_index + 0.5)
                draw_chart_text(page, category, plot.x0 - 4, center - 4, 7, align="right", max_width=38)
            else:
                slot = plot.width / category_count
                center = plot.x0 + slot * (category_index + 0.5)
                draw_chart_text(page, category, center, plot.y1 + 4, 7, align="center", max_width=max(10, slot - 2))

            positive_stack = 0.0
            negative_stack = 0.0
            total = sum(abs(item["values"][category_index]) if category_index < len(item["values"]) else 0 for item in chart["series"])
            for series_index, series in enumerate(chart["series"]):
                value = series["values"][category_index] if category_index < len(series["values"]) else 0.0
                display_value = value
                if grouping == "percentStacked":
                    value = (value / total * 100) if total else 0
                if grouping in ("stacked", "percentStacked"):
                    start = positive_stack if value >= 0 else negative_stack
                    end = start + value
                    if value >= 0:
                        positive_stack = end
                    else:
                        negative_stack = end
                    offset = 0
                    thickness = slot * 0.62
                else:
                    start = 0
                    end = value
                    thickness = slot * 0.72 / series_count
                    offset = (series_index - (series_count - 1) / 2) * thickness
                color = chart_point_color(chart, series_index, category_index)
                if horizontal:
                    x0 = plot.x0 + (start - minimum) / (maximum - minimum) * plot.width
                    x1 = plot.x0 + (end - minimum) / (maximum - minimum) * plot.width
                    bar = fitz.Rect(min(x0, x1), center + offset - thickness / 2, max(x0, x1), center + offset + thickness / 2)
                else:
                    y0 = plot.y1 - (start - minimum) / (maximum - minimum) * plot.height
                    y1 = plot.y1 - (end - minimum) / (maximum - minimum) * plot.height
                    bar = fitz.Rect(center + offset - thickness / 2, min(y0, y1), center + offset + thickness / 2, max(y0, y1))
                page.draw_rect(bar, color=color, fill=color, width=0.3)
                if chart["show_value"] or chart["show_category"] or chart["show_series"]:
                    label_parts = []
                    if chart["show_series"]:
                        label_parts.append(series["name"])
                    if chart["show_category"]:
                        label_parts.append(str(category))
                    if chart["show_value"]:
                        label_parts.append("{:g}".format(display_value))
                    label = " ".join(label_parts)
                    if horizontal:
                        draw_chart_text(page, label, bar.x1 + 2, bar.y0, 6)
                    else:
                        draw_chart_text(page, label, (bar.x0 + bar.x1) / 2, bar.y0 - 7, 6, align="center")

    def draw_line_chart(page, chart, rect):
        plot, minimum, maximum = draw_cartesian_axes(page, chart, rect, False)
        categories = chart["categories"]
        count = max(1, len(categories))
        for index, category in enumerate(categories):
            x = plot.x0 + (index + 0.5) * plot.width / count
            draw_chart_text(page, category, x, plot.y1 + 4, 7, align="center", max_width=max(10, plot.width / count - 2))
        for series_index, series in enumerate(chart["series"]):
            points = []
            for index, value in enumerate(series["values"][:count]):
                x = plot.x0 + (index + 0.5) * plot.width / count
                y = plot.y1 - (value - minimum) / (maximum - minimum) * plot.height
                points.append((x, y))
            if len(points) > 1:
                page.draw_polyline(points, color=series["color"], width=1.3)
            if series["marker"] != "none":
                for x, y in points:
                    page.draw_circle((x, y), 2.1, color=series["color"], fill=series["color"], width=0.4)
            if chart["show_value"] or chart["show_category"] or chart["show_series"]:
                for point_index, (x, y) in enumerate(points):
                    label_parts = []
                    if chart["show_series"]:
                        label_parts.append(series["name"])
                    if chart["show_category"] and point_index < len(categories):
                        label_parts.append(str(categories[point_index]))
                    if chart["show_value"]:
                        label_parts.append("{:g}".format(series["values"][point_index]))
                    draw_chart_text(page, " ".join(label_parts), x, y - 9, 6, align="center")

    def draw_pie_chart(page, chart, rect):
        values = chart["series"][0]["values"]
        total = sum(max(0, value) for value in values)
        if total <= 0:
            return False
        radius = max(8, min(rect.width, rect.height) / 2 - 5)
        center = fitz.Point(rect.x0 + rect.width / 2, rect.y0 + rect.height / 2)
        point = fitz.Point(center.x, center.y - radius)
        angle_start = -90.0
        for index, value in enumerate(values):
            angle = max(0, value) / total * 360
            color = chart_point_color(chart, 0, index)
            if angle > 0:
                point = page.draw_sector(center, point, angle, color=(1, 1, 1), fill=color, width=0.5, fullSector=True)
            if chart["show_percent"] or chart["show_value"] or chart["show_category"] or chart["show_series"]:
                middle = math.radians(angle_start + angle / 2)
                label_parts = []
                if chart["show_category"] and index < len(chart["categories"]):
                    label_parts.append(chart["categories"][index])
                if chart["show_series"]:
                    label_parts.append(chart["series"][0]["name"])
                if chart["show_value"]:
                    label_parts.append("{:g}".format(value))
                if chart["show_percent"]:
                    label_parts.append("{:.0f}%".format(value / total * 100))
                label_radius = radius * 0.62
                draw_chart_text(page, " ".join(label_parts), center.x + math.cos(middle) * label_radius,
                                center.y + math.sin(middle) * label_radius - 3, 6, align="center")
            angle_start += angle
        if chart["type"] == "doughnutChart":
            hole = radius * max(10, min(90, chart["hole_size"])) / 100
            page.draw_circle(center, hole, color=(1, 1, 1), fill=(1, 1, 1), width=0.5)
        return True

    def draw_chart_placeholder(page, rect, message="Unsupported chart"):
        page.draw_rect(rect, color=(0.65, 0.65, 0.65), width=0.7)
        draw_chart_text(page, message, rect.x0 + rect.width / 2, rect.y0 + rect.height / 2 - 5,
                        8, color=(0.35, 0.35, 0.35), align="center", max_width=rect.width - 12)

    def render_ooxml_chart(page, rect, chart_bytes):
        try:
            chart = parse_chart(etree.fromstring(chart_bytes))
        except Exception:
            chart = None
        if chart is None:
            draw_chart_placeholder(page, rect)
            return
        if chart["title"]:
            draw_chart_text(page, chart["title"], rect.x0 + rect.width / 2, rect.y0 + 4,
                            9, align="center", max_width=rect.width - 12, bold=True)
        plot_rect, legend_rect = chart_plot_and_legend_rects(chart, rect)
        try:
            if chart["type"] == "barChart":
                draw_bar_chart(page, chart, plot_rect)
            elif chart["type"] == "lineChart":
                draw_line_chart(page, chart, plot_rect)
            elif not draw_pie_chart(page, chart, plot_rect):
                draw_chart_placeholder(page, rect, "Chart data unavailable")
                return
            if legend_rect is not None:
                draw_chart_legend(page, chart, legend_rect)
        except Exception:
            draw_chart_placeholder(page, rect, "Chart rendering failed")

    def image_position_x(anchor, width, column_x, column_width, alignment=0):
        left = column_x
        right = column_x + column_width - width
        position_h = anchor.find("./wp:positionH", NS) if anchor is not None else None
        if position_h is not None:
            align = position_h.find("./wp:align", NS)
            if align is not None:
                value = str(align.text or "").lower()
                if value == "center":
                    left = column_x + (column_width - width) / 2
                elif value in ("right", "outside"):
                    left = right
            else:
                offset = position_h.find("./wp:posOffset", NS)
                if offset is not None and offset.text:
                    relative = position_h.get("relativeFrom", "column")
                    base = 0 if relative == "page" else (current_section["margin_left"] if relative == "margin" else column_x)
                    left = base + _emu_to_pt(offset.text)
        else:
            if alignment == 1:
                left = column_x + (column_width - width) / 2
            elif alignment == 2:
                left = right
        return max(column_x, min(right, left))

    def process_drawing(drawing, paragraph, alignment=0):
        nonlocal y_position
        blip = drawing.find(".//a:blip", NS)
        chart_element = drawing.find(".//c:chart", NS)
        if blip is None and chart_element is None:
            return False
        relation_id = blip.get(R + "embed") if blip is not None else chart_element.get(R + "id")
        if not relation_id:
            return False
        try:
            drawing_bytes = doc.part.rels[relation_id].target_part.blob
        except Exception:
            return False

        extent = drawing.find(".//wp:extent", NS)
        width = _emu_to_pt(extent.get("cx")) if extent is not None else 100
        height = _emu_to_pt(extent.get("cy")) if extent is not None else 100
        column_x, column_width = column_geometry()
        if width > column_width:
            scale = column_width / width
            width *= scale
            height *= scale
        max_height = flow_bottom() - current_section["margin_top"]
        if height > max_height:
            scale = max_height / height
            width *= scale
            height *= scale

        anchor = drawing.find("./wp:anchor", NS)
        is_float = anchor is not None and anchor.find("./wp:wrapSquare", NS) is not None
        if y_position + height > flow_bottom():
            advance_flow()
            column_x, column_width = column_geometry()

        x = image_position_x(anchor, width, column_x, column_width, alignment)
        top = y_position
        if anchor is not None:
            position_v = anchor.find("./wp:positionV", NS)
            if position_v is not None:
                offset = position_v.find("./wp:posOffset", NS)
                if offset is not None and offset.text:
                    relative = position_v.get("relativeFrom", "paragraph")
                    base = 0 if relative == "page" else (current_section["margin_top"] if relative == "margin" else y_position)
                    top = base + _emu_to_pt(offset.text)
        top = max(current_section["margin_top"], min(flow_bottom() - height, top))
        rect = fitz.Rect(x, top, x + width, top + height)
        if chart_element is not None:
            render_ooxml_chart(current_page, rect, drawing_bytes)
        else:
            current_page.insert_image(rect, stream=drawing_bytes)

        if is_float:
            dist_l = _emu_to_pt(anchor.get("distL"))
            dist_r = _emu_to_pt(anchor.get("distR"))
            dist_t = _emu_to_pt(anchor.get("distT"))
            dist_b = _emu_to_pt(anchor.get("distB"))
            current_floats.append({
                "page": current_page.number,
                "rect": rect,
                "wrap_rect": fitz.Rect(rect.x0 - dist_l, rect.y0 - dist_t, rect.x1 + dist_r, rect.y1 + dist_b),
            })
        else:
            y_position = rect.y1 + 5
        return True

    def has_page_break(paragraph):
        ppr = paragraph._element.find("./w:pPr", NS)
        if ppr is not None and ppr.find("./w:pageBreakBefore", NS) is not None:
            return True
        for line_break in paragraph._element.findall(".//w:br", NS):
            if _attr(line_break, "type") == "page":
                return True
        return False

    def render_paragraph(paragraph):
        nonlocal y_position, previous_style_name, column_top, pending_paragraph_after
        style_name = paragraph.style.name if paragraph.style else "Normal"
        paragraph_props = get_paragraph_properties(paragraph)
        numbering = get_numbering_info(paragraph, paragraph_props)
        layout = get_paragraph_layout(paragraph, style_name, numbering)
        forced_page_break = has_page_break(paragraph)
        if forced_page_break and y_position > column_top + 0.1:
            advance_flow(force_page=True)

        has_drawing = paragraph._element.find(".//w:drawing", NS) is not None
        has_section_break = paragraph._element.find("./w:pPr/w:sectPr", NS) is not None
        if not paragraph.text.strip() and not has_drawing and (forced_page_break or has_section_break):
            previous_style_name = style_name
            return

        contextual_pair = layout["contextual"] and previous_style_name == style_name
        if contextual_pair:
            before = 0
            pending_paragraph_after = 0.0
        else:
            before = layout["space_before"]
        if y_position <= column_top + 0.1:
            before = 0
            pending_paragraph_after = 0.0
        paragraph_gap = max(pending_paragraph_after, before)
        pending_paragraph_after = 0.0
        if paragraph_gap:
            ensure_space(paragraph_gap)
            if y_position > column_top + 0.1:
                y_position += paragraph_gap
        if len(current_section["columns"]) > 1 and column_index == 0 and y_position <= column_top + paragraph_gap + 0.1:
            column_top = y_position

        column_x, column_width = column_geometry()
        left_indent = layout["left_indent"]
        right_indent = layout["right_indent"]
        first_line_indent = layout["first_line_indent"]
        base_x = column_x + left_indent
        first_base_x = base_x + first_line_indent
        marker = None
        if numbering and numbering["text"]:
            marker = {
                "text": numbering["text"],
                "x": first_base_x,
                "props": numbering["props"],
            }
            first_base_x = base_x
        max_width = max(18, column_x + column_width - right_indent - base_x)
        alignment = layout["alignment"]
        bookmark_names = collect_bookmarks(paragraph)
        outline_level = get_outline_level(paragraph)
        if outline_level is not None:
            clear_floats_for_block()
            column_x, column_width = column_geometry()
            base_x = column_x + left_indent
            first_base_x = base_x + first_line_indent
            if marker:
                marker["x"] = first_base_x
                first_base_x = base_x
            max_width = max(18, column_x + column_width - right_indent - base_x)
        outline = None
        if outline_level is not None and paragraph.text.strip():
            outline = {"level": outline_level, "title": paragraph.text.strip()}

        segments = []
        had_content = False
        for content_item in paragraph.iter_inner_content():
            if isinstance(content_item, Hyperlink):
                link_target = {"uri": content_item.url or "", "fragment": content_item.fragment or ""}
                runs = content_item.runs
                is_link = True
            else:
                link_target = None
                runs = [content_item]
                is_link = False
            for run in runs:
                has_column_break = any(
                    _attr(line_break, "type") == "column"
                    for line_break in run._element.findall(".//w:br", NS)
                )
                if has_column_break:
                    if segments:
                        render_segments(segments, base_x, max_width, layout, alignment, marker,
                                        bookmark_names, outline, first_base_x)
                        segments = []
                        marker = None
                        outline = None
                        first_base_x = base_x
                    advance_flow()
                    next_column_x, next_column_width = column_geometry()
                    base_offset = base_x - column_x
                    first_offset = first_base_x - column_x
                    right_offset = max(0, column_width - base_offset - max_width)
                    column_x, column_width = next_column_x, next_column_width
                    base_x = column_x + base_offset
                    first_base_x = column_x + first_offset
                    max_width = max(18, column_width - base_offset - right_offset)
                drawings = run._element.findall(".//w:drawing", NS)
                if drawings and segments:
                    render_segments(segments, base_x, max_width, layout, alignment, marker,
                                    bookmark_names, outline, first_base_x)
                    segments = []
                    marker = None
                    outline = None
                    first_base_x = base_x
                for drawing in drawings:
                    if process_drawing(drawing, paragraph, alignment):
                        had_content = True
                if run.text:
                    segments.append({
                        "text": run.text,
                        "props": get_run_properties(run, paragraph_props, is_link),
                        "link": link_target,
                    })
                    had_content = True

        if segments:
            render_segments(segments, base_x, max_width, layout, alignment, marker,
                            bookmark_names, outline, first_base_x)
        elif not had_content and paragraph.text.strip():
            fallback = [{"text": paragraph.text, "props": paragraph_props, "link": None}]
            render_segments(fallback, base_x, max_width, layout, alignment, marker,
                            bookmark_names, outline, first_base_x)
        elif not had_content and not paragraph.text.strip():
            if bookmark_names:
                for name in bookmark_names:
                    bookmark_targets[name] = (current_page.number, base_x, y_position)
            empty_pieces = split_font_runs("M", paragraph_props)
            if empty_pieces:
                empty_pieces[0]["width"] = measure_piece(
                    empty_pieces[0]["text"], paragraph_props, empty_pieces[0]["font_kind"]
                )
                _, _, empty_line_height = line_vertical_metrics(empty_pieces, layout)
                ensure_space(empty_line_height)
                y_position += empty_line_height

        after = 0 if contextual_pair else layout["space_after"]
        pending_paragraph_after = after
        previous_style_name = style_name

    def table_grid(table):
        grid = table._tbl.find("./w:tblGrid", NS)
        widths = []
        if grid is not None:
            for grid_col in grid.findall("./w:gridCol", NS):
                widths.append(_twips_to_pt(_attr(grid_col, "w"), 0))
        if not widths:
            widths = [1.0 for _ in table.columns]
        return widths

    def table_indent(table):
        tbl_ind = table._tbl.find("./w:tblPr/w:tblInd", NS)
        return _twips_to_pt(_attr(tbl_ind, "w"), 0)

    def cell_content_segments(cell):
        output = []
        for paragraph_index, paragraph in enumerate(cell.paragraphs):
            if paragraph_index:
                props = get_paragraph_properties(paragraph)
                output.append({"text": "\n", "props": props, "link": None})
            output.extend(paragraph_segments(paragraph))
        return output

    def clear_floats_for_block():
        nonlocal y_position
        column_x, column_width = column_geometry()
        bottoms = []
        for floating in current_floats:
            rect = floating["wrap_rect"]
            if floating["page"] == current_page.number and rect.y1 > y_position:
                if rect.x1 > column_x and rect.x0 < column_x + column_width:
                    bottoms.append(rect.y1)
        if bottoms:
            y_position = max(y_position, max(bottoms))

    def render_table(table):
        nonlocal y_position, pending_paragraph_after
        if pending_paragraph_after and y_position > column_top + 0.1:
            ensure_space(pending_paragraph_after)
            if y_position > column_top + 0.1:
                y_position += pending_paragraph_after
        pending_paragraph_after = 0.0
        clear_floats_for_block()
        grid_widths = table_grid(table)
        indent = table_indent(table)
        column_x, column_width = column_geometry()
        source_width = sum(grid_widths)
        available_width = max(1, column_width + min(12.0, indent))
        scale = min(1.0, available_width / source_width) if source_width else 1.0
        grid_widths = [width * scale for width in grid_widths]
        table_x = column_x
        padding_x = 5.4
        padding_y = 3.0

        for row in table.rows:
            logical_cells = []
            cells = row.cells
            cell_index = 0
            grid_index = 0
            while cell_index < len(cells) and grid_index < len(grid_widths):
                cell = cells[cell_index]
                repeated = 1
                while cell_index + repeated < len(cells) and cells[cell_index + repeated]._tc is cell._tc:
                    repeated += 1
                grid_span = cell._tc.find("./w:tcPr/w:gridSpan", NS)
                declared = max(1, int(_attr(grid_span, "val", "1"))) if grid_span is not None else 1
                span = min(max(repeated, declared), len(grid_widths) - grid_index)
                width = sum(grid_widths[grid_index:grid_index + span])
                segments = cell_content_segments(cell)
                lines = fixed_lines(segments, max(1, width - padding_x + 3.0)) if segments else [[]]
                logical_cells.append({
                    "cell": cell, "span": span, "grid_index": grid_index,
                    "width": width, "lines": lines,
                })
                cell_index += repeated
                grid_index += span

            cell_heights = []
            for item in logical_cells:
                height = padding_y * 2
                for line in item["lines"]:
                    fontsize = max([piece["props"]["size"] for piece in line] or [11.0])
                    height += max(12.0, fontsize * 1.15)
                cell_heights.append(height)
            row_height = max([19.7] + cell_heights)
            ensure_space(row_height)
            if y_position + row_height > flow_bottom():
                advance_flow()
            column_x, column_width = column_geometry()
            table_x = column_x

            x = table_x
            for item in logical_cells:
                rect = fitz.Rect(x, y_position, x + item["width"], y_position + row_height)
                current_page.draw_rect(rect, color=(0.65, 0.65, 0.65), width=0.5)
                line_y = y_position + padding_y
                for line in item["lines"]:
                    fontsize = max([piece["props"]["size"] for piece in line] or [11.0])
                    line_height = max(12.0, fontsize * 1.15)
                    baseline = line_y + fontsize
                    cursor = x + padding_x
                    for piece in line:
                        draw_piece(current_page, cursor, baseline, piece, line_y, line_height)
                        cursor += piece["width"]
                    line_y += line_height
                x += item["width"]
            y_position += row_height

    new_page()
    for element in body:
        if element.tag == W + "p":
            render_paragraph(Paragraph(element, doc))
        elif element.tag == W + "tbl":
            render_table(Table(element, doc))

        if id(element) in boundary_ids and section_cursor + 1 < len(section_specs):
            section_cursor += 1
            apply_section(section_specs[section_cursor])

    if len(pdf) == 0:
        new_page()

    merged_links = []
    for link in pending_links:
        rect = fitz.Rect(link["rect"])
        if merged_links:
            previous = merged_links[-1]
            previous_rect = fitz.Rect(previous["rect"])
            same_line = abs(previous_rect.y0 - rect.y0) < 0.5 and abs(previous_rect.y1 - rect.y1) < 0.5
            if (previous["page"] == link["page"] and previous["target"] == link["target"]
                    and same_line and rect.x0 <= previous_rect.x1 + 1.0):
                previous["rect"] = (
                    min(previous_rect.x0, rect.x0), min(previous_rect.y0, rect.y0),
                    max(previous_rect.x1, rect.x1), max(previous_rect.y1, rect.y1),
                )
                continue
        merged_links.append(dict(link))

    for link in merged_links:
        target = link["target"]
        uri = target.get("uri") or ""
        fragment = target.get("fragment") or ""
        link_data = None
        if uri:
            link_data = {"kind": fitz.LINK_URI, "from": fitz.Rect(link["rect"]), "uri": uri}
        elif fragment:
            destination = (0, current_section["margin_left"], current_section["margin_top"]) if fragment.lower() == "_top" else bookmark_targets.get(fragment)
            if destination is not None:
                link_data = {
                    "kind": fitz.LINK_GOTO,
                    "from": fitz.Rect(link["rect"]),
                    "page": destination[0],
                    "to": fitz.Point(destination[1], destination[2]),
                }
        if link_data is not None:
            try:
                pdf.load_page(link["page"]).insert_link(link_data)
            except Exception:
                pass

    if toc_entries:
        try:
            pdf.set_toc(toc_entries, collapse=0)
        except Exception:
            simple_toc = [entry[:3] for entry in toc_entries]
            pdf.set_toc(simple_toc, collapse=0)
    page_count = len(pdf)
    pdf_bytes = pdf.tobytes(garbage=4, deflate=True, clean=True)
    pdf.close()
    return pdf_bytes, page_count
`;

let converterInstance = null;

export class PyodideDocxConverter {
    constructor(options = {}) {
        const basePath = options.basePath || DEFAULT_BASE_PATH;
        this.basePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
        this.fontUrl = options.fontUrl || DEFAULT_FONT_URL;
        this.callback = { ...DEFAULT_CALLBACK, ...(options.callback || {}) };
        this.pyodide = null;
        this.initialized = false;
        this.initPromise = null;
    }

    setCallback(callback) {
        if (callback) {
            this.callback = { ...DEFAULT_CALLBACK, ...callback };
        }
    }

    async initialize() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;

        this.callback.onBeforeInit();
        this.initPromise = this.initializeConverter();
        try {
            await this.initPromise;
            this.callback.onAfterInit();
        } finally {
            this.initPromise = null;
        }
    }

    async initializeConverter() {
        try {
            const { loadPyodide } = await import(
                /* webpackIgnore: true */
                `${this.basePath}pyodide.js`
            );
            const pyodide = await loadPyodide({
                indexURL: this.basePath,
                fullStdLib: false
            });

            for (const item of PACKAGES) {
                //item.phase
                this.callback.onConvert(item.percent);
                await pyodide.loadPackage(`${this.basePath}${item.file}`);
            }

            this.callback.onConvert(25);
            const fontResources = [
                { url: this.fontUrl, path: FONT_PATH, label: 'CJK font' },
                ...BUNDLED_FONT_RESOURCES
            ];
            const fontResponses = await Promise.all(fontResources.map(async resource => {
                const response = await fetch(resource.url, { cache: 'force-cache' });
                if (!response.ok) {
                    throw new Error(`Failed to load ${resource.label} (${response.status}).`);
                }
                return {
                    ...resource,
                    data: new Uint8Array(await response.arrayBuffer())
                };
            }));
            for (const resource of fontResponses) {
                pyodide.FS.writeFile(resource.path, resource.data);
            }

            this.callback.onConvert(30);
            pyodide.runPython(PYTHON_CONVERTER);
            this.pyodide = pyodide;
            this.initialized = true;
        } catch (error) {
            this.pyodide = null;
            this.initialized = false;
            throw error;
        }
    }

    isReady() {
        return this.initialized && this.pyodide !== null;
    }

    async convertToPdf(file) {
        if (!this.isReady()) {
            throw new Error('Pyodide DOCX converter not initialized.');
        }
        if (!file || file.size === 0) {
            throw new Error('The document is empty.');
        }
        const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';
        if (inputFormat !== 'docx') {
            throw new Error('Pyodide DOCX converter only supports DOCX files.');
        }

        this.callback.onConvert(40);
        const input = new Uint8Array(await file.arrayBuffer());
        let convertFunction;
        let result;
        try {
            this.callback.onConvert(60);
            convertFunction = this.pyodide.globals.get('convert_docx_to_pdf');
            result = convertFunction(input);
            const resultJs = result.toJs();
            const output = resultJs[0];
            this.callback.onConvert(95);
            const blob = new Blob([output], { type: PDF_MIME });
            this.callback.onConvert(100);
            return blob;
        } finally {
            result?.destroy?.();
            convertFunction?.destroy?.();
        }
    }
}

export function getPyodideDocxConverter(options = {}) {
    if (!converterInstance) {
        converterInstance = new PyodideDocxConverter(options);
    } else {
        converterInstance.setCallback(options.callback);
    }
    return converterInstance;
}
