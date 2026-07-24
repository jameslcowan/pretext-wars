#!/usr/bin/env python3
"""Generate the Residential Room Sublease Agreement PDF.

Replaces the placeholder-padded draft (each article's sentence repeated ~10x)
with original, substantive provisions while keeping the same parties, terms,
and professional article structure. Run: python3 generate_sublease.py
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

OUT = "Residential_Room_Sublease_Agreement.pdf"

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
                      "Sublessor Initials: __________          Subtenant Initials: __________")
    canvas.drawRightString(PAGE_W - MARGIN, y,
                           f"Page {canvas.getPageNumber()}")
    canvas.setStrokeColor(colors.HexColor("#999999"))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, y + 14, PAGE_W - MARGIN, y + 14)
    canvas.setFont("Times-Italic", 8)
    canvas.drawCentredString(PAGE_W / 2, 0.35 * inch,
                             "Residential Room Sublease Agreement — 2605 Cascade Falls Dr, Austin, TX 78738")
    canvas.restoreState()


doc = BaseDocTemplate(
    OUT, pagesize=letter,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=0.8 * inch, bottomMargin=0.95 * inch,
    title="Residential Room Sublease Agreement",
    author="Matthew Cowan / James Cowan Jr.",
)
frame = Frame(MARGIN, 0.95 * inch, PAGE_W - 2 * MARGIN,
              PAGE_H - 0.8 * inch - 0.95 * inch, id="main")
doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=footer)])

story = []
S = styles

story.append(Paragraph("RESIDENTIAL ROOM SUBLEASE AGREEMENT", S["title"]))
story.append(Paragraph("Month-to-Month Tenancy — State of Texas", S["subtitle"]))

summary_data = [
    ["Property Owner:", "Dunn Family Cemetery Inc."],
    ["Sublessor:", "Matthew Cowan"],
    ["Subtenant:", "James Cowan Jr."],
    ["Premises:", "One private bedroom at 2605 Cascade Falls Dr, Austin, TX 78738"],
    ["Monthly Rent:", "US $750.00 (utilities not included)"],
    ["Security Deposit:", "None"],
    ["Term:", "Month-to-month, beginning on the Effective Date below"],
]
t = Table([[Paragraph(f"<b>{k}</b>", S["summary"]), Paragraph(v, S["summary"])]
           for k, v in summary_data],
          colWidths=[1.6 * inch, PAGE_W - 2 * MARGIN - 1.6 * inch])
t.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#888888")),
    ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cccccc")),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
]))
story.append(t)
story.append(Spacer(1, 10))

story.append(Paragraph(
    'This Residential Room Sublease Agreement (this "Agreement") is made effective as of '
    '_________________________, 20____ (the "Effective Date"), by and between Matthew Cowan '
    '(the "Sublessor") and James Cowan Jr. (the "Subtenant"). The Sublessor and the Subtenant '
    'are sometimes referred to individually as a "Party" and collectively as the "Parties."',
    S["body"]))

ARTICLES = [
    ("Article 1 – Parties", [
        'The Sublessor is Matthew Cowan, an occupant of the residence located at 2605 Cascade '
        'Falls Dr, Austin, Texas 78738 with rights of occupancy in that residence. The Subtenant '
        'is James Cowan Jr., who desires to rent one private bedroom within the residence together '
        'with the shared use of its common areas. The owner of the real property is Dunn Family '
        'Cemetery Inc. (the "Owner"). This Agreement creates a sublease of a room only; it does not '
        'transfer any ownership interest in the Property and does not create any landlord-tenant '
        'relationship between the Subtenant and the Owner except as required by law.',
    ]),
    ("Article 2 – Definitions", [
        'For purposes of this Agreement: (a) "Property" means the residence and land located at '
        '2605 Cascade Falls Dr, Austin, Texas 78738; (b) "Bedroom" means the private bedroom '
        'designated by the Sublessor for the Subtenant\'s exclusive use, together with any closet '
        'attached to it; (c) "Common Areas" means the kitchen, living room, dining areas, '
        'bathrooms not located within another occupant\'s private room, hallways, laundry '
        'facilities, driveway, and yard; (d) "Premises" means the Bedroom together with the '
        'non-exclusive right to use the Common Areas; and (e) "Rent" means the monthly rent '
        'described in Article 7.',
    ]),
    ("Article 3 – Premises; Exclusive Use of Bedroom", [
        'The Sublessor subleases the Premises to the Subtenant, and the Subtenant rents the '
        'Premises from the Sublessor, on the terms of this Agreement. The Subtenant shall have '
        'exclusive possession of the Bedroom during the term of this Agreement. The Sublessor '
        'shall not enter the Bedroom except (a) with the Subtenant\'s consent, (b) in an emergency '
        'threatening life or property, or (c) upon at least twenty-four (24) hours\' notice for '
        'repairs, maintenance, or inspection at a reasonable time.',
    ]),
    ("Article 4 – Shared Common Areas", [
        'The Subtenant shall have non-exclusive use of the Common Areas in common with the '
        'Sublessor and any other authorized occupants of the residence. Each occupant shall use '
        'the Common Areas considerately, clean up after their own use, and refrain from storing '
        'personal belongings in the Common Areas in a manner that unreasonably interferes with '
        'their use by others. Household supplies for the Common Areas shall be shared or '
        'purchased as the occupants may agree from time to time.',
    ]),
    ("Article 5 – Authority to Sublease", [
        'The Sublessor represents that he holds lawful rights of occupancy in the Property and '
        'that he has the authority, by agreement or authorization concerning the Property, to '
        'grant the occupancy described in this Agreement. If any consent of the Owner is required, '
        'the Sublessor is responsible for obtaining it, and an acknowledgment line for the Owner '
        'is provided at the end of this Agreement. This Agreement is a sublease of a room only and '
        'is not a conveyance of any interest in the real property.',
    ]),
    ("Article 6 – Term", [
        'The tenancy under this Agreement is month-to-month. It begins on the Effective Date and '
        'automatically continues for successive one-month periods until terminated by either '
        'Party in accordance with Article 18 (Notice of Termination) or by operation of Texas '
        'law. No fixed end date applies, and neither Party is obligated beyond the notice period '
        'described in Article 18.',
    ]),
    ("Article 7 – Rent", [
        'The Subtenant shall pay the Sublessor rent of Seven Hundred Fifty and 00/100 Dollars '
        '(US $750.00) per month, due and payable in advance on or before the first (1st) day of '
        'each calendar month. Rent shall be paid by cash, check, or electronic transfer to the '
        'Sublessor, or by any other method the Parties agree to in writing. If the tenancy begins '
        'or ends on a day other than the first day of a month, Rent for that partial month shall '
        'be prorated on a daily basis. Rent received shall be applied first to the oldest amount '
        'outstanding.',
    ]),
    ("Article 8 – Utilities", [
        'Utilities and services — including electricity, water, wastewater, gas (if any), trash '
        'collection, and internet — are not included in Rent. The occupants of the residence '
        'shall allocate utility costs among themselves by separate agreement, and the Subtenant '
        'shall pay his agreed share promptly when due. Failure to pay an agreed utility share is '
        'treated the same as failure to pay Rent under Article 17 (Default).',
    ]),
    ("Article 9 – Security Deposit", [
        'No security deposit is required under this Agreement. If the Parties later agree in a '
        'signed writing that a deposit will be collected, that writing shall state the amount, '
        'and the deposit shall be held and returned in accordance with Chapter 92, Subchapter C '
        'of the Texas Property Code.',
    ]),
    ("Article 10 – Occupancy", [
        'The Bedroom shall be occupied only by the Subtenant. The Subtenant shall use the '
        'Premises solely as a private residence and for no business or unlawful purpose. No other '
        'person may reside in the Bedroom or the residence at the Subtenant\'s invitation without '
        'the prior written approval of the Sublessor.',
    ]),
    ("Article 11 – Guests", [
        'The Subtenant may host occasional guests, provided guests do not remain overnight for '
        'more than three (3) consecutive nights, or more than seven (7) nights in any calendar '
        'month, without the Sublessor\'s prior written consent. The Subtenant is responsible for '
        'the conduct of his guests and for any damage they cause. A guest who exceeds these '
        'limits without consent is an unauthorized occupant, and the Sublessor may require the '
        'guest to leave.',
    ]),
    ("Article 12 – Keys and Access", [
        'The Sublessor shall provide the Subtenant with keys, codes, or other means of access to '
        'the residence and the Bedroom on or before the Effective Date. The Subtenant shall not '
        'duplicate keys or share access codes without the Sublessor\'s consent, shall keep the '
        'residence secured, and shall return all keys and access devices upon termination of the '
        'tenancy. The Subtenant shall not change or add locks without the Sublessor\'s consent, '
        'except as permitted by Texas law.',
    ]),
    ("Article 13 – Maintenance", [
        'The Subtenant shall keep the Bedroom clean and sanitary, dispose of garbage properly, '
        'and exercise reasonable care in the use of the Common Areas, fixtures, and appliances. '
        'The Subtenant shall promptly notify the Sublessor of any condition in the Premises '
        'needing repair, any water leak, and any pest problem. The Subtenant shall not make '
        'alterations, paint, or install fixtures without the Sublessor\'s prior written consent.',
    ]),
    ("Article 14 – Repairs", [
        'The Sublessor shall pursue repairs affecting habitability with reasonable diligence, '
        'either by performing them or by pursuing them with the Owner or the Owner\'s agent, '
        'consistent with the obligations and remedies set out in Chapter 92 of the Texas Property '
        'Code. The Subtenant shall provide notice of needed repairs as described in Article 18\'s '
        'notice provisions and shall allow reasonable access for repairs to be made.',
    ]),
    ("Article 15 – Damage", [
        'The Subtenant is responsible for the cost of repairing any damage to the Premises or '
        'the residence caused by the Subtenant or the Subtenant\'s guests, beyond ordinary wear '
        'and tear. Ordinary wear and tear means deterioration that results from intended use '
        'without negligence, carelessness, accident, or abuse. Amounts owed under this Article '
        'are due within thirty (30) days after the Sublessor delivers a written, itemized '
        'statement of the cost of repair.',
    ]),
    ("Article 16 – Quiet Enjoyment", [
        'Each Party shall respect the other\'s peaceful enjoyment of the residence. The Subtenant '
        'is entitled to quiet enjoyment of the Bedroom, and all occupants shall refrain from '
        'unreasonable noise or disturbances, particularly between 10:00 p.m. and 7:00 a.m., and '
        'shall comply with all applicable laws and any homeowners\' association rules that apply '
        'to the Property.',
    ]),
    ("Article 17 – Default", [
        'The Subtenant is in default if he (a) fails to pay Rent or an agreed utility share when '
        'due, (b) materially breaches any other provision of this Agreement and fails to cure the '
        'breach within a reasonable time after written notice, or (c) uses the Premises for an '
        'unlawful purpose. Upon default, the Sublessor may terminate the tenancy and pursue the '
        'remedies available under Texas law, including Chapter 24 of the Texas Property Code '
        '(eviction) after any legally required notice to vacate. The Sublessor shall not use '
        '"self-help" measures prohibited by law, such as lockouts or utility shutoffs, except as '
        'expressly permitted by the Texas Property Code.',
    ]),
    ("Article 18 – Notices; Notice of Termination", [
        'All notices under this Agreement shall be in writing and delivered personally, by mail, '
        'or by electronic means (including text message or email) if the receiving Party has '
        'agreed to that method. Notice is effective upon personal delivery, three (3) days after '
        'mailing, or upon confirmed electronic delivery.',
        'Either Party may terminate this month-to-month tenancy for any reason by giving the '
        'other Party at least one (1) month\'s written notice, consistent with Section 91.001 of '
        'the Texas Property Code. The tenancy terminates on the later of the date stated in the '
        'notice or one month after the notice is given. On or before the termination date, the '
        'Subtenant shall vacate the Bedroom, remove all personal property, return all keys and '
        'access devices, and leave the Premises in the condition required by this Agreement.',
    ]),
    ("Article 19 – Proof of Residency", [
        'The Parties acknowledge that, upon execution, this Agreement establishes the '
        'Subtenant\'s lawful residential occupancy of the Property beginning on the Effective '
        'Date, subject to the terms of this Agreement. The Sublessor shall, upon reasonable '
        'request, confirm the Subtenant\'s residency to third parties with a legitimate need for '
        'verification (such as government agencies, schools, employers, or financial '
        'institutions).',
    ]),
    ("Article 20 – Governing Law", [
        'This Agreement is governed by, and shall be construed in accordance with, the laws of '
        'the State of Texas, without regard to conflict-of-law principles. Venue for any dispute '
        'arising out of this Agreement lies in the county in which the Property is located.',
    ]),
    ("Article 21 – Severability", [
        'If any provision of this Agreement is held invalid or unenforceable, that provision '
        'shall be enforced to the maximum extent permitted, and the remaining provisions shall '
        'continue in full force and effect.',
    ]),
    ("Article 22 – Entire Agreement; Amendments; Waiver", [
        'This Agreement contains the entire understanding of the Parties concerning the subject '
        'matter and supersedes all prior oral or written agreements concerning it. Any amendment '
        'must be in writing and signed by both Parties. A Party\'s failure to enforce any '
        'provision on one occasion is not a waiver of that provision or of the right to enforce '
        'it on any other occasion.',
    ]),
]

for heading, paras in ARTICLES:
    block = [Paragraph(heading, S["heading"])]
    block += [Paragraph(p, S["body"]) for p in paras]
    story.append(KeepTogether(block))

story.append(Paragraph("Article 23 – Signatures", S["heading"]))
story.append(Paragraph(
    'By signing below, each Party acknowledges having read and understood this Agreement and '
    'agrees to be bound by its terms, executed voluntarily as of the Effective Date.',
    S["body"]))
story.append(Spacer(1, 14))

sig_lines = [
    ("SUBLESSOR", "Matthew Cowan"),
    ("SUBTENANT", "James Cowan Jr."),
]
for role, name in sig_lines:
    story.append(KeepTogether([
        Paragraph(f"<b>{role}</b>", S["sig"]),
        Spacer(1, 22),
        Paragraph("_________________________________________", S["sig"]),
        Paragraph(name, S["sig"]),
        Paragraph("Date: _______________________", S["sig"]),
        Spacer(1, 14),
    ]))

story.append(KeepTogether([
    Paragraph("<b>OPTIONAL ACKNOWLEDGMENT BY PROPERTY OWNER</b>", S["sig"]),
    Paragraph(
        "The undersigned, on behalf of the Owner, acknowledges this room sublease.",
        S["body"]),
    Spacer(1, 22),
    Paragraph("_________________________________________", S["sig"]),
    Paragraph("Authorized Representative, Dunn Family Cemetery Inc.", S["sig"]),
    Paragraph("Date: _______________________", S["sig"]),
]))

doc.build(story)
print(f"wrote {OUT}")
