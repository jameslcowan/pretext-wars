#!/usr/bin/env python3
"""Generate the Residential Lease Agreement PDF.

Direct lease: Dunn Family Cemetery Inc. (Landlord) to James Cowan Jr.
(Tenant), fixed two-year term. Standard residential lease provisions only.
Run: python3 generate_lease.py
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table,
    TableStyle, KeepTogether,
)
from reportlab.lib import colors

OUT = "Residential_Lease_Agreement.pdf"

PAGE_W, PAGE_H = letter
MARGIN = 0.9 * inch

styles = {
    "title": ParagraphStyle(
        "title", fontName="Times-Bold", fontSize=16, leading=20,
        alignment=TA_CENTER, spaceAfter=4,
    ),
    "subtitle": ParagraphStyle(
        "subtitle", fontName="Times-Roman", fontSize=11, leading=14,
        alignment=TA_CENTER, spaceAfter=14, textColor=colors.HexColor("#444444"),
    ),
    "heading": ParagraphStyle(
        "heading", fontName="Times-Bold", fontSize=12, leading=15,
        spaceBefore=14, spaceAfter=5,
    ),
    "body": ParagraphStyle(
        "body", fontName="Times-Roman", fontSize=10.5, leading=14.5,
        alignment=TA_JUSTIFY, spaceAfter=7,
    ),
    "summary": ParagraphStyle(
        "summary", fontName="Times-Roman", fontSize=10.5, leading=15,
    ),
    "sig": ParagraphStyle(
        "sig", fontName="Times-Roman", fontSize=10.5, leading=16,
    ),
}


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Times-Roman", 9)
    y = 0.55 * inch
    canvas.drawString(MARGIN, y,
                      "Landlord Initials: __________          Tenant Initials: __________")
    canvas.drawRightString(PAGE_W - MARGIN, y,
                           f"Page {canvas.getPageNumber()}")
    canvas.setStrokeColor(colors.HexColor("#999999"))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, y + 14, PAGE_W - MARGIN, y + 14)
    canvas.setFont("Times-Italic", 8)
    canvas.drawCentredString(PAGE_W / 2, 0.35 * inch,
                             "Residential Lease Agreement — 2605 Cascade Falls Dr, Austin, TX 78738")
    canvas.restoreState()


doc = BaseDocTemplate(
    OUT, pagesize=letter,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=0.8 * inch, bottomMargin=0.95 * inch,
    title="Residential Lease Agreement",
    author="Dunn Family Cemetery Inc. / James Cowan Jr.",
)
frame = Frame(MARGIN, 0.95 * inch, PAGE_W - 2 * MARGIN,
              PAGE_H - 0.8 * inch - 0.95 * inch, id="main")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=footer)])

story = []
S = styles

story.append(Paragraph("RESIDENTIAL LEASE AGREEMENT", S["title"]))
story.append(Paragraph("Fixed Term — State of Texas", S["subtitle"]))

summary_data = [
    ["Landlord:", "Dunn Family Cemetery Inc., PO Box 342162, Austin, TX 78734-0037"],
    ["Tenant:", "James Cowan Jr."],
    ["Premises:", "2605 Cascade Falls Dr, Austin, TX 78738 (Travis County)"],
    ["Legal Description:", "Lot 17, Block A, Lake Pointe Sec. 3, Phase 1"],
    ["Monthly Rent:", "US $3,500.00 (utilities not included)"],
    ["Security Deposit:", "None"],
    ["Term:", "Twenty-four (24) months, beginning on the Commencement Date below"],
]
t = Table([[Paragraph(f"<b>{k}</b>", S["summary"]), Paragraph(v, S["summary"])]
           for k, v in summary_data],
          colWidths=[1.6 * inch, PAGE_W - 2 * MARGIN - 1.6 * inch])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#888888")),
    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)
story.append(Spacer(1, 10))

story.append(Paragraph(
    'This Residential Lease Agreement (this "Lease") is made effective as of '
    '_________________________, 20____ (the "Commencement Date"), by and between Dunn Family '
    'Cemetery Inc., a Texas corporation (the "Landlord"), and James Cowan Jr. (the "Tenant"). '
    'The Landlord and the Tenant are sometimes referred to individually as a "Party" and '
    'collectively as the "Parties."',
    S["body"]))

ARTICLES = [
    ("Article 1 – Premises", [
        'The Landlord leases to the Tenant, and the Tenant leases from the Landlord, the '
        'residence and land located at 2605 Cascade Falls Dr, Austin, Texas 78738, in Travis '
        'County, legally described as Lot 17, Block A, Lake Pointe Section 3, Phase 1 (the '
        '"Premises"), for use solely as a private residence. The Tenant accepts the Premises in '
        'their present condition, subject to the Landlord\'s repair obligations under this Lease '
        'and Texas law.',
    ]),
    ("Article 2 – Term", [
        'The term of this Lease is a fixed period of twenty-four (24) months, beginning on the '
        'Commencement Date and ending at 11:59 p.m. on the day before the second anniversary of '
        'the Commencement Date (the "Expiration Date"), unless terminated earlier under this '
        'Lease or applicable law. If the Tenant remains in possession after the Expiration Date '
        'with the Landlord\'s consent but without a new written lease, the tenancy becomes '
        'month-to-month on the terms of this Lease, terminable by either Party on one (1) '
        'month\'s written notice under Section 91.001 of the Texas Property Code.',
    ]),
    ("Article 3 – Rent", [
        'The Tenant shall pay the Landlord rent of Three Thousand Five Hundred and 00/100 '
        'Dollars (US $3,500.00) per month, due and payable in advance on or before the first (1st) day of '
        'each calendar month, without demand or offset. Rent shall be paid by check or electronic '
        'transfer to the Landlord at the address or account the Landlord designates in writing. '
        'If the term begins or ends on a day other than the first day of a month, rent for that '
        'partial month shall be prorated on a daily basis. Payments received shall be applied '
        'first to the oldest amount outstanding.',
    ]),
    ("Article 4 – Utilities", [
        'Utilities and services — including electricity, water, wastewater, gas (if any), trash '
        'collection, cable, and internet — are not included in rent. The Tenant shall place the '
        'utilities serving the Premises in the Tenant\'s name where the provider permits and '
        'shall pay all utility charges for the Premises promptly when due.',
    ]),
    ("Article 5 – Security Deposit", [
        'No security deposit is required under this Lease. If the Parties later agree in a signed '
        'writing that a deposit will be collected, that writing shall state the amount, and the '
        'deposit shall be held and returned in accordance with Chapter 92, Subchapter C of the '
        'Texas Property Code.',
    ]),
    ("Article 6 – Occupancy and Use", [
        'The Premises shall be occupied only by the Tenant and shall be used solely as a private '
        'residence and for no business or unlawful purpose. No other person may reside at the '
        'Premises without the Landlord\'s prior written approval. Guests may stay overnight for '
        'reasonable periods; any guest remaining more than fourteen (14) consecutive days '
        'without the Landlord\'s written consent is an unauthorized occupant.',
    ]),
    ("Article 7 – Maintenance by Tenant", [
        'The Tenant shall keep the Premises clean and sanitary, dispose of garbage properly, '
        'perform routine upkeep such as replacing light bulbs and HVAC filters, maintain the '
        'yard in a reasonably neat condition unless the Parties agree otherwise in writing, and '
        'use all fixtures, appliances, and systems with reasonable care. The Tenant shall '
        'promptly notify the Landlord in writing of any condition needing repair, any water '
        'leak, and any pest problem.',
    ]),
    ("Article 8 – Repairs by Landlord", [
        'The Landlord shall make repairs necessary to remedy conditions that materially affect '
        'the physical health or safety of an ordinary tenant, and shall install and maintain '
        'smoke alarms and security devices, in each case as required by Chapter 92 of the Texas '
        'Property Code. The Tenant shall give notice of needed repairs as provided in Article 15 '
        'and shall allow the Landlord reasonable access to make repairs.',
    ]),
    ("Article 9 – Alterations", [
        'The Tenant shall not make alterations or improvements to the Premises, paint, or '
        'install fixtures without the Landlord\'s prior written consent, and shall not change or '
        'add locks except as permitted by Texas law. Approved alterations become part of the '
        'Premises unless the consent provides otherwise.',
    ]),
    ("Article 10 – Landlord's Right of Entry", [
        'The Landlord or its agents may enter the Premises (a) with the Tenant\'s consent, '
        '(b) in an emergency threatening life or property, or (c) upon at least twenty-four (24) '
        'hours\' notice, at reasonable times, to inspect, make repairs, or show the Premises to '
        'prospective purchasers or, during the final sixty (60) days of the term, prospective '
        'tenants.',
    ]),
    ("Article 11 – Assignment and Subletting", [
        'The Tenant shall not assign this Lease or sublet all or any part of the Premises '
        'without the Landlord\'s prior written consent.',
    ]),
    ("Article 12 – Damage; Insurance", [
        'The Tenant is responsible for the cost of repairing any damage to the Premises caused '
        'by the Tenant or the Tenant\'s guests, beyond ordinary wear and tear, with amounts due '
        'within thirty (30) days after the Landlord delivers a written itemized statement. The '
        'Landlord\'s insurance does not cover the Tenant\'s personal property; the Tenant is '
        'encouraged to obtain renter\'s insurance.',
    ]),
    ("Article 13 – Quiet Enjoyment", [
        'So long as the Tenant is not in default, the Tenant shall have quiet enjoyment of the '
        'Premises. The Tenant shall not disturb neighbors, shall comply with all applicable '
        'laws, and shall comply with any homeowners\' association rules applicable to the '
        'Premises, copies of which the Landlord shall provide.',
    ]),
    ("Article 14 – Default; Remedies", [
        'The Tenant is in default if the Tenant (a) fails to pay rent when due, (b) materially '
        'breaches any other provision of this Lease and fails to cure within a reasonable time '
        'after written notice, or (c) uses the Premises for an unlawful purpose. Upon default, '
        'the Landlord may terminate the Tenant\'s right of possession and pursue the remedies '
        'available under Texas law, including eviction under Chapter 24 of the Texas Property '
        'Code after any legally required notice to vacate, subject to the Landlord\'s duty to '
        'mitigate damages under Section 91.006. The Landlord shall not use lockouts or utility '
        'shutoffs except as expressly permitted by the Texas Property Code. The Landlord is in '
        'default if it fails to perform a material obligation under this Lease and does not cure '
        'within a reasonable time after written notice, in which case the Tenant may pursue the '
        'remedies available under Chapter 92 of the Texas Property Code.',
    ]),
    ("Article 15 – Notices", [
        'All notices under this Lease shall be in writing. Notices to the Landlord shall be '
        'delivered to Dunn Family Cemetery Inc., PO Box 342162, Austin, TX 78734-0037, or such '
        'other address as the Landlord designates in writing. Notices to the Tenant shall be '
        'delivered to the Premises. Notice may be given personally, by mail, or by electronic '
        'means if the receiving Party has agreed to that method, and is effective upon personal '
        'delivery, three (3) days after mailing, or upon confirmed electronic delivery.',
    ]),
    ("Article 16 – Early Termination; Holdover", [
        'Except as provided by Texas law (including statutory early-termination rights for '
        'family violence, certain sex offenses or stalking, and military deployment under '
        'Sections 92.016, 92.0161, and 92.017 of the Texas Property Code), neither Party may '
        'terminate this Lease before the Expiration Date without the other Party\'s written '
        'agreement. If the Tenant holds over without the Landlord\'s consent after this Lease '
        'ends, the Landlord may pursue possession and damages as provided by law.',
    ]),
    ("Article 17 – Governing Law", [
        'This Lease is governed by, and shall be construed in accordance with, the laws of the '
        'State of Texas, without regard to conflict-of-law principles. Venue for any dispute '
        'arising out of this Lease lies in Travis County, Texas.',
    ]),
    ("Article 18 – Severability", [
        'If any provision of this Lease is held invalid or unenforceable, that provision shall '
        'be enforced to the maximum extent permitted, and the remaining provisions shall '
        'continue in full force and effect.',
    ]),
    ("Article 19 – Entire Agreement; Amendments; Waiver", [
        'This Lease contains the entire agreement of the Parties concerning its subject matter '
        'and supersedes all prior oral or written agreements concerning it. Any amendment must '
        'be in writing and signed by both Parties. A Party\'s failure to enforce any provision '
        'on one occasion is not a waiver of that provision or of the right to enforce it on any '
        'other occasion.',
    ]),
]

for heading, paras in ARTICLES:
    block = [Paragraph(heading, S["heading"])]
    block += [Paragraph(p, S["body"]) for p in paras]
    story.append(KeepTogether(block))

story.append(Paragraph("Article 20 – Signatures", S["heading"]))
story.append(Paragraph(
    'By signing below, each Party acknowledges having read and understood this Lease and agrees '
    'to be bound by its terms as of the Commencement Date. This Lease is not effective until '
    'signed by both the Tenant and a representative authorized to act for the Landlord.',
    S["body"]))
story.append(Spacer(1, 14))

story.append(KeepTogether([
    Paragraph("<b>LANDLORD</b> — Dunn Family Cemetery Inc.", S["sig"]),
    Spacer(1, 22),
    Paragraph("By: _________________________________________", S["sig"]),
    Paragraph("Printed Name: _______________________________", S["sig"]),
    Paragraph("Title: ______________________________________", S["sig"]),
    Paragraph("Date: _______________________", S["sig"]),
    Spacer(1, 18),
]))

story.append(KeepTogether([
    Paragraph("<b>TENANT</b>", S["sig"]),
    Spacer(1, 22),
    Paragraph("_________________________________________", S["sig"]),
    Paragraph("James Cowan Jr.", S["sig"]),
    Paragraph("Date: _______________________", S["sig"]),
]))

doc.build(story)
print(f"wrote {OUT}")
