"""
Generate gbv-use-case-diagram.drawio — colorful sectioned portrait layout.

Sections (top to bottom):
  Anonymous Reporter  (purple)
  Victim              (green)
  District Admin      (green, darker)
  Police Officer      (blue)
  System Admin        (blue, darker)
  Social Worker       (orange)
  Partner Institution (pink)
"""

import os
import xml.etree.ElementTree as ET

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _id():
    _id.counter += 1
    return str(_id.counter)
_id.counter = 0


def add_cell(parent, cell_id, value="", style="", vertex=1, edge=0,
             x=0, y=0, w=120, h=40, source=None, target=None):
    cell = ET.SubElement(parent, "mxCell",
                         id=cell_id,
                         value=value,
                         style=style,
                         vertex=str(vertex),
                         edge=str(edge),
                         parent="1")
    if edge:
        cell.set("source", source or "")
        cell.set("target", target or "")
        ET.SubElement(cell, "mxGeometry", relative="1", **{"as": "geometry"})
    else:
        geo = ET.SubElement(cell, "mxGeometry", **{"as": "geometry"})
        geo.set("x", str(x))
        geo.set("y", str(y))
        geo.set("width", str(w))
        geo.set("height", str(h))
    return cell


# ---------------------------------------------------------------------------
# style constants
# ---------------------------------------------------------------------------

FONT       = "fontFamily=Helvetica;fontSize=10;"
TITLE_FONT = "fontFamily=Helvetica;fontSize=11;fontStyle=1;"


def section_style(fill, stroke):
    return (
        f"rounded=1;whiteSpace=wrap;html=1;"
        f"fillColor={fill};strokeColor={stroke};strokeWidth=2;"
        f"dashed=1;dashPattern=8 4;"
        f"verticalAlign=top;{TITLE_FONT}opacity=40;"
    )


def actor_style(fill, stroke):
    return (
        f"shape=mxgraph.flowchart.actor;fillColor={fill};strokeColor={stroke};"
        f"strokeWidth=2;{FONT}"
    )


def usecase_style(fill, stroke):
    return (
        f"ellipse;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
        f"strokeWidth=1.5;{FONT}align=center;"
    )


def arrow_style():
    return (
        "edgeStyle=orthogonalEdgeStyle;html=1;"
        "exitX=1;exitY=0.5;entryX=0;entryY=0.5;"
    )


def include_style():
    return (
        "edgeStyle=orthogonalEdgeStyle;html=1;dashed=1;"
        "endArrow=open;endFill=0;strokeColor=#666666;fontSize=9;"
    )


# ---------------------------------------------------------------------------
# colour palette per actor
# ---------------------------------------------------------------------------

PALETTE = {
    "anon":     {"bg": "#E1D5E7", "stroke": "#9673A6", "actor_fill": "#9673A6", "actor_stroke": "#5E4C72"},
    "victim":   {"bg": "#D5E8D4", "stroke": "#82B366", "actor_fill": "#82B366", "actor_stroke": "#4D7A3A"},
    "district": {"bg": "#D5E8D4", "stroke": "#5A9E5A", "actor_fill": "#5A9E5A", "actor_stroke": "#3A7A3A"},
    "police":   {"bg": "#DAE8FC", "stroke": "#6C8EBF", "actor_fill": "#6C8EBF", "actor_stroke": "#3A5F8A"},
    "admin":    {"bg": "#DAE8FC", "stroke": "#4A7AB5", "actor_fill": "#4A7AB5", "actor_stroke": "#2A5A95"},
    "social":   {"bg": "#FFE6CC", "stroke": "#D79B00", "actor_fill": "#D6B656", "actor_stroke": "#B46504"},
    "partner":  {"bg": "#F8CECC", "stroke": "#B85450", "actor_fill": "#E07070", "actor_stroke": "#A03030"},
}

# ---------------------------------------------------------------------------
# layout constants
# ---------------------------------------------------------------------------

PAGE_W = 1400
MARGIN = 30
SEC_X  = MARGIN
SEC_W  = PAGE_W - 2 * MARGIN

SEC_HEIGHTS = {
    "anon":     200,
    "victim":   210,
    "district": 230,
    "police":   260,
    "admin":    280,
    "social":   210,
    "partner":  200,
}

UC_W    = 155
UC_H    = 52
UC_GAP_X = 20
UC_GAP_Y = 14

ACTOR_W = 50
ACTOR_H = 70

# ---------------------------------------------------------------------------
# use-case definitions
# ---------------------------------------------------------------------------

ACTORS = [
    {
        "key": "anon",
        "label": "Anonymous Reporter",
        "usecases": [
            "Submit Anonymous Report",
            "Upload Evidence",
            "Check Anonymous Status",
            "Conversation with Police\n(via Case ID)",
        ],
        "includes": [("Submit Anonymous Report", "Upload Evidence")],
    },
    {
        "key": "victim",
        "label": "Victim",
        "usecases": [
            "Register Victim Account",
            "Login",
            "Submit Report",
            "View Cases",
            "Update Own Case",
            "Withdraw Own Case",
            "View Notifications",
        ],
        "includes": [],
    },
    {
        "key": "district",
        "label": "District Administrator",
        "usecases": [
            "Assign the Case",
            "View Case Summary",
            "View Cases on Map",
            "Submit Incident Reports",
            "Staff Directory",
            "Inter Agency Referrals",
            "District Analytics",
            "Export Report",
        ],
        "includes": [],
    },
    {
        "key": "police",
        "label": "Police Officer",
        "usecases": [
            "Login",
            "View Cases",
            "Accept / Reject Case",
            "Conversation with Reporter\n(via Case ID)",
            "Mark Case In Progress",
            "Case Updates",
            "Resolve Case",
            "Manage Referrals",
            "View Analytics",
            "Reports & Export",
        ],
        "includes": [],
    },
    {
        "key": "admin",
        "label": "System Administrator",
        "usecases": [
            "Login",
            "View Cases Summary",
            "Report Victim Case",
            "Case Assignments",
            "Case Updates",
            "View Victim Recovery Journey",
            "Export Reports",
            "User Management",
            "Assign Referrals",
            "View On-Going Activities",
            "View Notifications",
            "View Support Tracking",
        ],
        "includes": [],
    },
    {
        "key": "social",
        "label": "Social Worker",
        "usecases": [
            "Login",
            "Submit Report",
            "Manage Referrals",
            "Manage Recovery Milestones",
            "Reports & Export",
            "Update Profile",
            "View Analytics",
        ],
        "includes": [],
    },
    {
        "key": "partner",
        "label": "Partner Institution Officer",
        "usecases": [
            "View Referral Notifications",
            "View Referrals Assigned",
            "Respond to the Referral",
            "Export Reports of the Referrals",
        ],
        "includes": [],
    },
]

# ---------------------------------------------------------------------------
# build XML
# ---------------------------------------------------------------------------

root = ET.Element(
    "mxGraphModel",
    dx="1200", dy="800",
    grid="1", gridSize="10",
    guides="1", tooltips="1",
    connect="1", arrows="1",
    fold="1", page="1",
    pageScale="1", pageWidth="1654",
    pageHeight="2339",
    math="0", shadow="0",
)

ET.SubElement(root, "mxCell", id="0")
parent_cell = ET.SubElement(root, "mxCell", id="1", parent="0")

# diagram title
add_cell(
    parent_cell, _id(),
    value="GBV Monitor — Use Case Diagram",
    style=f"text;html=1;align=center;{TITLE_FONT}fontSize=16;fontStyle=1;",
    x=SEC_X, y=10, w=SEC_W, h=40,
)

# ---------------------------------------------------------------------------
# lay out sections
# ---------------------------------------------------------------------------

cur_y = 65
uc_ids: dict[str, str] = {}   # "key|label" -> mxCell id

for actor in ACTORS:
    key   = actor["key"]
    pal   = PALETTE[key]
    sec_h = SEC_HEIGHTS[key]
    ucs   = actor["usecases"]

    # section background
    add_cell(
        parent_cell, _id(),
        value=actor["label"],
        style=section_style(pal["bg"], pal["stroke"]),
        x=SEC_X, y=cur_y, w=SEC_W, h=sec_h,
    )

    # actor figure (vertically centred in section)
    actor_y  = cur_y + (sec_h - ACTOR_H) // 2
    actor_id = _id()
    add_cell(
        parent_cell, actor_id,
        value=actor["label"],
        style=actor_style(pal["actor_fill"], pal["actor_stroke"]),
        x=SEC_X + 20, y=actor_y, w=ACTOR_W, h=ACTOR_H,
    )

    # use-case ellipses — flow left-to-right, wrap into rows
    uc_start_x = SEC_X + ACTOR_W + 60
    uc_area_w  = SEC_W - ACTOR_W - 80
    cols       = max(1, int(uc_area_w // (UC_W + UC_GAP_X)))

    rows_needed = (len(ucs) + cols - 1) // cols
    total_uc_h  = rows_needed * UC_H + max(0, rows_needed - 1) * UC_GAP_Y
    uc_start_y  = cur_y + (sec_h - total_uc_h) // 2

    for idx, uc_label in enumerate(ucs):
        col   = idx % cols
        row   = idx // cols
        ux    = uc_start_x + col * (UC_W + UC_GAP_X)
        uy    = uc_start_y + row * (UC_H + UC_GAP_Y)
        uc_id = _id()
        add_cell(
            parent_cell, uc_id,
            value=uc_label,
            style=usecase_style(pal["bg"], pal["stroke"]),
            x=ux, y=uy, w=UC_W, h=UC_H,
        )
        uc_ids[f"{key}|{uc_label}"] = uc_id

        # actor -> use-case association line
        arr = ET.SubElement(
            parent_cell, "mxCell",
            id=_id(), value="",
            style=arrow_style(),
            edge="1",
            source=actor_id,
            target=uc_id,
            parent="1",
        )
        ET.SubElement(arr, "mxGeometry", relative="1", **{"as": "geometry"})

    # «include» dashed arrows
    for src_label, tgt_label in actor.get("includes", []):
        src_id = uc_ids.get(f"{key}|{src_label}")
        tgt_id = uc_ids.get(f"{key}|{tgt_label}")
        if src_id and tgt_id:
            inc = ET.SubElement(
                parent_cell, "mxCell",
                id=_id(), value="«include»",
                style=include_style(),
                edge="1",
                source=src_id,
                target=tgt_id,
                parent="1",
            )
            ET.SubElement(inc, "mxGeometry", relative="1", **{"as": "geometry"})

    cur_y += sec_h + 15   # gap between sections

# ---------------------------------------------------------------------------
# write file
# ---------------------------------------------------------------------------

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gbv-use-case-diagram.drawio")
tree = ET.ElementTree(root)
ET.indent(tree, space="  ")
tree.write(out_path, encoding="unicode", xml_declaration=False)
print(f"Written -> {out_path}")
