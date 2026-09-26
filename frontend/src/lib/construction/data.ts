export const REGIONS = [
  { id: "dodoma", name: "Dodoma", multiplier: 1, note: "Gharama za kati — mji mkuu" },
  { id: "dar", name: "Dar es Salaam", multiplier: 1.28, note: "Gharama za juu zaidi nchini" },
  { id: "arusha", name: "Arusha", multiplier: 1.16, note: "Vifaa na fundi wa bei ya juu" },
  { id: "mwanza", name: "Mwanza", multiplier: 1.08, note: "Usafirishaji wa ziwa huongeza bei" },
  { id: "mbeya", name: "Mbeya", multiplier: 1.05, note: "Mchanga na kokoto vinapatikana karibu" },
  { id: "morogoro", name: "Morogoro", multiplier: 1.02, note: "Karibu na Dar, bei wastani" },
  { id: "tanga", name: "Tanga", multiplier: 1.06, note: "Pwani — bati na nondo vinapatikana" },
  { id: "mtwara", name: "Mtwara", multiplier: 1.1, note: "Usafirishaji mrefu wa vifaa" },
  { id: "zanzibar", name: "Zanzibar", multiplier: 1.32, note: "Visiwa — usafirishaji na vibali" },
  { id: "kilimanjaro", name: "Kilimanjaro", multiplier: 1.12, note: "Moshi / Hai — bei ya kati-juu" },
  { id: "iringa", name: "Iringa", multiplier: 1.04, note: "Nyanda za juu, mchanga mzuri" },
  { id: "tabora", name: "Tabora", multiplier: 0.98, note: "Gharama za chini kidogo" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export const FINISH_LEVELS = [
  {
    id: "msingi",
    name: "Msingi",
    multiplier: 0.86,
    blurb: "Saruji ya wazi, madirisha ya kawaida, bila gypsum.",
  },
  {
    id: "wastani",
    name: "Wastani",
    multiplier: 1,
    blurb: "Finishes za kawaida, rangi, tiles za bafu, paa la bati.",
  },
  {
    id: "maridadi",
    name: "Maridadi",
    multiplier: 1.42,
    blurb: "Gypsum, tiles za imported, madirisha ya aluminium, kitchen unit.",
  },
] as const;

export type FinishId = (typeof FINISH_LEVELS)[number]["id"];

export const STOREYS = [
  { id: 1, name: "Ghorofa moja", multiplier: 1 },
  { id: 2, name: "Ghorofa mbili", multiplier: 1.14 },
  { id: 3, name: "Ghorofa tatu", multiplier: 1.26 },
] as const;

/** Base TSh per m² for a standard 1-storey house in Dodoma, wastani finish. */
export const BASE_COST_PER_SQM = 435_000;

/** Material ratios calibrated to the JengaAI Dodoma 120m² 3-bed example. */
export const MATERIAL_RATIOS = {
  cementBagsPerSqm: 3.75,
  rebarKgPerSqm: 15,
  sandLorriesPerSqm: 0.2,
  aggregateLorriesPerSqm: 0.133,
  ironSheetsPerSqm: 0.6,
  blocksPerSqm: 42,
  paintLitresPerSqm: 0.35,
};

export const UNIT_PRICES_TZS = {
  cementBag: 19_500,
  rebarKg: 3_200,
  sandLorry: 120_000,
  aggregateLorry: 160_000,
  ironSheet: 24_000,
  block: 1_100,
  paintLitre: 12_000,
};

export const PRODUCTS = [
  {
    id: "cement-simba",
    name: "Saruji Simba 50kg",
    brand: "Simba Cement",
    category: "Saruji",
    unit: "mfuko",
    price: 19_500,
    blurb: "Saruji ya Portland — msingi, nguzo na slab.",
  },
  {
    id: "cement-twiga",
    name: "Saruji Twiga 50kg",
    brand: "Twiga Cement",
    category: "Saruji",
    unit: "mfuko",
    price: 18_800,
    blurb: "Chaguo la bei nafuu kwa kuta na plaster.",
  },
  {
    id: "rebar-12",
    name: "Nondo 12mm × 12m",
    brand: "MM Steel",
    category: "Nondo",
    unit: "kipande",
    price: 22_000,
    blurb: "Kwa msingi, beam na nguzo za nyumba ya kawaida.",
  },
  {
    id: "rebar-16",
    name: "Nondo 16mm × 12m",
    brand: "MM Steel",
    category: "Nondo",
    unit: "kipande",
    price: 38_500,
    blurb: "Kwa nguzo na beam za ghorofa mbili.",
  },
  {
    id: "block-6",
    name: "Matofali 6 inch",
    brand: "Local kiln",
    category: "Kuta",
    unit: "kipande",
    price: 1_100,
    blurb: "Kuta za nje na za ndani — nyumba ya ghorofa moja.",
  },
  {
    id: "block-9",
    name: "Matofali 9 inch",
    brand: "Local kiln",
    category: "Kuta",
    unit: "kipande",
    price: 1_600,
    blurb: "Kuta za nje zenye insulation bora.",
  },
  {
    id: "sheet-28",
    name: "Bati Gauge 28 (3m)",
    brand: "ALAFS",
    category: "Paa",
    unit: "kipande",
    price: 24_000,
    blurb: "Paa la kawaida la nyumba za Tanzania.",
  },
  {
    id: "sheet-26",
    name: "Bati Gauge 26 (3m)",
    brand: "ALAFS",
    category: "Paa",
    unit: "kipande",
    price: 31_000,
    blurb: "Bati nene zaidi — paahizi za miaka mingi.",
  },
  {
    id: "sand",
    name: "Mchanga (lori 7 tani)",
    brand: "Quar",
    category: "Mchanga",
    unit: "lori",
    price: 120_000,
    blurb: "Mchanga wa ujenzi — msingi, plaster na slab.",
  },
  {
    id: "aggregate",
    name: "Kokoto (lori 7 tani)",
    brand: "Quarry",
    category: "Kokoto",
    unit: "lori",
    price: 160_000,
    blurb: "Kokoto 3/4 — concrete ya msingi na slab.",
  },
  {
    id: "gypsum",
    name: "Gypsum board 9mm",
    brand: "Knauf",
    category: "Interior",
    unit: "kipande",
    price: 18_000,
    blurb: "Dari ya kisasa ya sebuleni na master bedroom.",
  },
  {
    id: "paint-goldstar",
    name: "Rangi Goldstar 20L",
    brand: "Goldstar",
    category: "Rangi",
    unit: "ndoo",
    price: 78_000,
    blurb: "Rangi ya kuta za ndani — inashika vizuri kwenye plaster.",
  },
  {
    id: "tiles-40",
    name: "Tiles 40×40 (sanduku)",
    brand: "Kajaria",
    category: "Tiles",
    unit: "sanduku",
    price: 32_000,
    blurb: "Bafu na sebuleni — 1.44 m² kwa sanduku.",
  },
  {
    id: "window-alu",
    name: "Dirisha aluminium 1.2×1.2",
    brand: "Local fabricator",
    category: "Madirisha",
    unit: "kipande",
    price: 185_000,
    blurb: "Dirisha la sliding na neth — usalama na hewa.",
  },
  {
    id: "door-hardwood",
    name: "Mlango wa mti 0.9×2.1",
    brand: "Mtwara timber",
    category: "Milango",
    unit: "kipande",
    price: 220_000,
    blurb: "Mlango wa nje wa mti mgumu na fremu.",
  },
] as const;

export type Product = (typeof PRODUCTS)[number];

export const EXPERTS = [
  {
    id: "amina",
    name: "Amina Juma",
    title: "Msanifu Majengo",
    titleEn: "Architect",
    city: "Dar es Salaam",
    years: 11,
    focus: "Nyumba za familia na ramani za 2D/3D",
    rate: "TSh 450,000 / ukaguzi",
    initials: "AJ",
  },
  {
    id: "joseph",
    name: "Joseph Mwakasege",
    title: "Mhandisi wa Miundo",
    titleEn: "Structural Engineer",
    city: "Dodoma",
    years: 14,
    focus: "Msingi, nguzo, beam na slab za ghorofa",
    rate: "TSh 380,000 / ukaguzi",
    initials: "JM",
  },
  {
    id: "neema",
    name: "Neema Shirima",
    title: "Mbunifu wa Ndani",
    titleEn: "Interior Designer",
    city: "Arusha",
    years: 8,
    focus: "Rangi, gypsum, samani na mwanga",
    rate: "TSh 320,000 / ukaguzi",
    initials: "NS",
  },
  {
    id: "daniel",
    name: "Daniel Komba",
    title: "Quantity Surveyor",
    titleEn: "QS",
    city: "Mwanza",
    years: 12,
    focus: "Bajeti, BOQ na mikataba ya mafundi",
    rate: "TSh 300,000 / ukaguzi",
    initials: "DK",
  },
  {
    id: "fatma",
    name: "Fatma Ally",
    title: "Mshauri wa Vibali",
    titleEn: "Permits",
    city: "Dodoma",
    years: 9,
    focus: "Vibali vya manispaa, hatimiliki na NEMC",
    rate: "TSh 250,000 / faili",
    initials: "FA",
  },
  {
    id: "hassan",
    name: "Hassan Mdee",
    title: "Site Engineer",
    titleEn: "Site Engineer",
    city: "Mbeya",
    years: 16,
    focus: "Usimamizi wa ujenzi wa kila siku",
    rate: "TSh 1.2M / mwezi",
    initials: "HM",
  },
] as const;

export const REGULATIONS = [
  {
    id: "permit",
    title: "Kibali cha Ujenzi (Building Permit)",
    body: "Kabla ya kuchimba msingi, omba kibali katika halmashauri ya mji au manispaa inayohusika. Utahitaji ramani zilizotiwa saini na msanifu, hatimiliki au leseni ya kiwanja, na fomu ya maombi. Kwa nyumba ya kawaida ya familia, maombi huchukua wiki 2–8 kulingana na mji.",
  },
  {
    id: "title",
    title: "Hatimiliki / Haki ya Kumiliki",
    body: "Jenga tu kwenye kiwanja chenye hati halali: Certificate of Right of Occupancy, offer letter, au hatimiliki. Jenga nje ya mipaka na heshimu barabara, njia za umeme na mabomba ya maji.",
  },
  {
    id: "setback",
    title: "Umbali kutoka Mpaka (Setbacks)",
    body: "Nyumba nyingi za makazi zinahitaji angalau mita 1.5–3 kutoka mpaka wa jirani na mita 3–6 kutoka barabara, kulingana na by-laws za manispaa. Thibitisha na idara ya mipango miji kabla ya kuchimba.",
  },
  {
    id: "coverage",
    title: "Kiwango cha Kujaza Kiwanja",
    body: "Usijaze kiwanja chote. Kwa maeneo ya makazi, plot coverage ya 40–60% ni kawaida — acha nafasi ya hewa, maji ya mvua na maegesho. Ghorofa mbili zinahitaji msingi na nguzo zilizokaguliwa na mhandisi.",
  },
  {
    id: "structure",
    title: "Ramani za Miundo",
    body: "Nyumba ya ghorofa mbili au zaidi, au yenye slab ya saruji, inahitaji structural drawings kutoka kwa mhandisi aliyeusajiliwa. Msingi wa kina, nondo za beam na nguzo visipuuzwe — hapa ndipo makosa ya gharama kubwa hutokea.",
  },
  {
    id: "nemc",
    title: "NEMC na Mazingira",
    body: "Miradi midogo ya nyumba ya familia mara nyingi haihitaji EIA kamili. Miradi mikubwa, karibu na mto, pwani au msitu inaweza kuhitaji tathmini ya NEMC. Uliza halmashauri yako.",
  },
  {
    id: "contract",
    title: "Mkataba na Mafundi",
    body: "Andika mkataba: kazi, muda, malipo kwa hatua (msingi, kuta, paa, finishes), na nani ananunua vifaa. Usilipe zaidi ya 30% kabla kazi haijaanza. Weka picha za kila hatua.",
  },
  {
    id: "osha",
    title: "Usalama wa Tovuti",
    body: "Weka uzio, helmeti, na usimamizi wa shimo la msingi. Watoto na wanyama wasikaribie. Kwa kazi ya urefu (paa, ghorofa) tumia madaraja salama — si miti.",
  },
  {
    id: "water-power",
    title: "Maji, Umeme na Maji Taka",
    body: "Omba meter ya TANESCO na DAWASA/DUWASA mapema — uunganisho unaweza kuchukua wiki. Choo cha septic tank kiwe chini ya mteremko, angalau mita 15 kutoka kisima.",
  },
];

export const CONTRACTORS_REGISTRATION_ACT = {
  id: "contractors-registration-act-cap-235",
  title: "The Contractors Registration Act, Chapter 235 (R.E. 2023)",
  summary:
    "A practical reference to the Tanzanian law governing registration, development, promotion and conduct of contractors. Confirm the current official text and requirements with the Contractors Registration Board before acting.",
  source: "/SHERIA%20ZA%20UJENZI.pdf",
  parts: [
    {
      title: "Part I — Preliminary Provisions",
      sections: [
        { number: 1, title: "Short title", detail: "The law is cited as the Contractors Registration Act." },
        { number: 2, title: "Interpretation", detail: "Defines key terms including Appeals Authority, Board, construction works, contractor, foreign and local firms, registered contractor, Registrar, and technical qualifications, experience, skills or conduct." },
      ],
    },
    {
      title: "Part II — The Board",
      sections: [
        { number: 3, title: "Establishment of Board", detail: "Establishes the Contractors Registration Board as a body corporate with power to sue and be sued, hold property, and make by-laws." },
        { number: 4, title: "Functions of Board", detail: "The Board handles contractor registration, fees, registers, professional conduct, site inspection, enforcement, training, awards, advisory services, project registration, contractor classification, stop orders and dispute settlement." },
        { number: 5, title: "Limitation of liabilities", detail: "Protects Board members and employees from personal liability for acts or omissions done in good faith while carrying out their duties." },
        { number: 6, title: "Appointment of Registrar", detail: "Provides for appointment of a Registrar with suitable engineering, architecture, quantity surveying, legal, economic, finance or management qualifications." },
        { number: 7, title: "Registers of contractors", detail: "Requires registers for contractor types, categories and classes, including building, civil, electrical, mechanical and specialist contractors." },
      ],
    },
    {
      title: "Part III — Registration",
      sections: [
        { number: 8, title: "Publication of registers and lists", detail: "Requires publication of registered contractor details and annual lists in the Gazette." },
        { number: 9, title: "Publication as evidence of registration", detail: "Published registers and certified extracts are prima facie evidence of registration or removal and may be accepted by courts and authorised bodies. A person may inspect the register and documents relating to an entry and obtain a copy or extract on payment of the prescribed fee. A court order compelling production must bear the court seal and state that it is issued by a court. The Registrar is generally not required to produce the register or appear to prove an entry unless the court orders it for special cause." },
        { number: 10, title: "Qualification for registration", detail: "An applicant must apply in the prescribed manner, pay the prescribed fees, and satisfy the Board that they have the required technical qualifications, skills, construction experience, professional conduct, plants and equipment, and registration or certificate of compliance from the Business Registration and Licensing Agency. Sole proprietors have class limits under the Act. The Board may refuse registration where conditions are not met, there is professional conflict of interest, or the applicant is a practising architect, quantity surveyor, engineer or consulting firm providing those services. A registration certificate states the number, type, category, class, date and duration, remains Board property, and must be returned after suspension or cancellation. Forged documents, misrepresentation, fraud, inducement or corruption may lead to deferral and debarment for up to two years." },
        { number: 11, title: "Restriction to carry out construction", detail: "A person or firm must not undertake or cause construction works to be carried out and completed unless registered by the Board and holding a valid registration certificate." },
        { number: 12, title: "Temporary registration", detail: "A foreign firm may receive temporary registration for a specific contract where it is incorporated outside Tanzania, meets the Board’s financial and competence requirements, uses expatriate skills unavailable in Tanzania, and undertakes to wind up or stop contracting after the contracted works and defects-liability period. Temporary registration applies only for the directed contract period; the certificate must be returned within twenty-one days after expiry. The Board may extend projects executed in phases." },
        { number: 13, title: "Restriction on registration of non-foreign firms", detail: "A non-citizen may not form a local contracting firm unless the majority of authorised shares are owned by Tanzanian citizens. Share ownership is assessed through direct and corporate shareholders. Clients engaging contractors under public procurement provisions must ensure prescribed fees are paid. The Board may require competence evidence and may refuse registration for failure to meet section 10, professional conflict, unsuitable permits, or unfit professional conduct." },
        { number: 14, title: "Notification of changes", detail: "A contractor must notify the Board of any change to directors, partners or other shareholders within twenty-one days from the date of the change." },
      ],
    },
    {
      title: "Part IV — Cancellation and Suspension of Registration",
      sections: [
        { number: 15, title: "Power to cancel registration", detail: "The Board may delete a contractor from the register for failure to keep a current address, non-payment of annual fees, failure to meet registration criteria, abandonment of works, negligence, breach of conditions, bankruptcy, winding-up, forgery, misrepresentation, fraud, corruption or breach of the Act. The contractor must surrender the certificate. A sole proprietor, partner, director or shareholder of a deleted company may be restricted from registering a new contracting business for three years unless the Board directs otherwise." },
        { number: 16, title: "Restriction on payment of annual subscription fee", detail: "A registered contractor must pay the Board’s annual subscription fee by 30 June each calendar year. Failure to pay means the contractor immediately ceases to operate and may not undertake or continue construction works under the Act." },
        { number: 17, title: "Restoration to Register", detail: "A deleted name may only be restored on the Board’s direction after an inquiry or application. The Board may confirm deletion, restore the contractor, lift a suspension, set an effective date and require a prescribed penalty fee." },
        { number: 18, title: "Power to suspend registration", detail: "The Board may suspend a contractor convicted under the Act, found guilty of improper or gross professional misconduct, or holding an invalid or improperly obtained business licence. It may also caution or censure, suspend the effect of registration, delete the name, or take legal action." },
        { number: 19, title: "Proceedings at inquiry", detail: "A contractor under inquiry has the right to appear and be heard. The Board may administer oaths, summon witnesses, order documents, and record evidence. Board inquiries are treated as judicial proceedings for the relevant Penal Code provisions." },
        { number: 20, title: "Disobedience to summons", detail: "Failure without sufficient cause to answer questions or produce documents ordered under an inquiry is an offence. On conviction, the penalty may include a fine of at least one hundred thousand shillings, imprisonment from six months up to one year, or both. Witnesses retain privileges applicable before the High Court." },
        { number: 21, title: "Appeals against decisions of Board", detail: "A contractor may appeal to the Appeals Authority against refusal of registration, deletion from a register, or suspension of registration. The Board may appear and be heard as a respondent." },
        { number: 22, title: "Appeals Authority", detail: "Establishes the Appeals Authority. It consists of a chair appointed by the Minister, a member from the Office of the Attorney General nominated by the Attorney General, and four members appointed by the Minister: a practising registered architect nominated by the Architectural Association of Tanzania, a practising registered quantity surveyor nominated by the Tanzania Institute of Quantity Surveyors, a practising registered engineer nominated by the Association of Consulting Engineers Tanzania, and a registered contractor nominated by the Contractor’s Association. A person aggrieved by the Appeals Authority’s decision may appeal to the High Court." },
        { number: 23, title: "Rules before Appeals Authority", detail: "The Minister may, after consulting the Attorney General, make rules for appeals, further evidence, fees, procedure and notification of the Board. Subject to those rules, the inquiry and evidence provisions in sections 19 and 20 apply, with necessary changes, to appeals and persons summoned before the Appeals Authority." },
      ],
    },
    {
      title: "Part V — Restriction on Trading as Contractor",
      sections: [
        { number: 24, title: "Use of ‘Registered Contractor’ description", detail: "A contractor whose name remains in the register may use the style and title ‘Registered Contractor’, or another Board-approved title, and offer services to the public for reward or trade as a registered contractor." },
        { number: 25, title: "Restriction on carrying on business", detail: "It is an offence for an unregistered person or firm to pretend to be registered, use a title implying registration, hold out as a qualified and experienced contractor, or trade as a contractor in Tanzania. It is also an offence for a registered contractor to allow an unregistered person to use its name, or for an employer/developer to engage an unregistered contractor. Penalties may include fines linked to the contract sum or project value, statutory minimum fines, imprisonment and both, depending on the offence." },
        { number: 26, title: "Bodies operating as contractors", detail: "A company, partnership or other body may not carry on contracting business unless it is registered and has at least one suitably qualified, skilled and experienced technical director or partner who is also a shareholder where required. If that person resigns, becomes incapacitated or dies, the firm may complete an ongoing project but must secure a technical director within sixty days or risk deregistration. The event must be reported to the Board within twenty-one days. Contravention may result in a fine linked to the contract sum or project value or imprisonment." },
        { number: 27, title: "Meaning of carrying on business", detail: "A person is deemed to be carrying on business or trading as a contractor when, for valuable consideration or reward, they offer or render contractor services to another person under a labour contract, contract of service, contract for services or otherwise." },
      ],
    },
    {
      title: "Part VI — Board Activities and Financial Provisions",
      sections: [
        { number: 28, title: "Delegation of functions", detail: "The Board may delegate functions under the Act to an officer or committee of the Board." },
        { number: 29, title: "Accounts and audit", detail: "The Board must keep proper books of account and, after each financial year, prepare an income and expenditure statement, an assets and liabilities statement, and a cash-flow statement. These must be submitted to duly registered and authorised auditors. Audited accounts must reach the Board within three months after the relevant financial year, and the Board Chairman submits the report to the Minister." },
        { number: 30, title: "Board report", detail: "At the end of each financial year, the Board must prepare a report on its activities and submit it to the Minister." },
        { number: 31, title: "Funds of Board", detail: "Board funds may come from registration and annual subscription fees, Parliamentary or Government subvention, grants and loans, borrowing for Board purposes, and money payable to or vested in the Board under written law or in connection with its functions." },
        { number: 32, title: "Power to invest", detail: "The Board may invest its funds only in investments authorised by, and subject to conditions prescribed under, the Trustee Investments Act." },
        { number: 33, title: "Annual accounts and Registrar’s report", detail: "The Minister must cause the annual financial statements with the auditors’ report and a copy of the Registrar’s report to be laid before the National Assembly as soon as practicable after receiving them." },
        { number: 34, title: "Minister’s directives", detail: "The Minister may issue written general or specific directives to the Board, and the Board must comply with them." },
      ],
    },
    {
      title: "Part VII — General Provisions",
      sections: [
        { number: 35, title: "Offences", detail: "It is an offence to fraudulently make or permit a false register entry, fraudulently procure registration or a contractor trading licence, knowingly make a materially false or misleading statement to gain an advantage under the Act, or wilfully disobey a lawful Board or Registrar order, direction, notice or summons. Conviction may result in a fine between three hundred thousand and one million shillings, imprisonment of at least two years, or both." },
        { number: 36, title: "Compounding offences", detail: "The Registrar may compound an offence subject to the Act by requiring payment of an amount directed by the Board, where the person admits the offence in writing and agrees to compounding. The Registrar must issue a receipt and submit a quarterly list of compounded offences to the Board." },
        { number: 37, title: "Annual returns", detail: "A registered contractor must prepare and submit annual returns in the prescribed manner. Contravention is an offence carrying a fine of 0.5% of the applicable class limit." },
        { number: 38, title: "Regulations by Minister", detail: "Subject to section 39, the Minister may make regulations for carrying out the Act, including Board business and inquiries, committees, Registrar duties, registration eligibility, discipline of Registrar and officers, stop-order procedures, and other lawful implementation matters." },
        { number: 39, title: "By-laws", detail: "With the Minister’s consent, the Board may make by-laws on contractor ethics, categories and classes, class limits, registration conditions and fees, certificates and extracts, annual returns, foreign contractors, reasonable profit margins, dispute reconciliation and arbitration, recognised qualifications, Board awards, course and seminar fees, class upgrading, and evaluation of certificates, diplomas, degrees and transcripts." },
        { number: 40, title: "Notice of closure of construction", detail: "Where works are being carried out by an unregistered firm or individual, or an act or omission breaches the Act, the Board may issue a notice requiring construction to stop or the breach to be rectified. Failure to comply is an offence punishable by a fine of three to five million shillings, imprisonment for three years, and for a continuing offence a further fine of up to one hundred thousand shillings for each day or part of a day." },
        { number: 41, title: "Irregularity in Board proceedings", detail: "An act or proceeding of the Board is not invalid only because the number of members was incomplete, a member’s appointment had a defect, or a member was disqualified or not entitled to act at the relevant time." },
        { number: 42, title: "Repeal", detail: "Repeals the Architect, Quantity Surveyors and Building Contractors (Registration) Act. The omitted subsection is preserved as omitted in the official text." },
        { number: 43, title: "Savings", detail: "Anything done or action taken under the repealed Act remains valid, so far as it is not inconsistent with this Act, and is treated as done under the corresponding provision of this Act. Subsidiary legislation made under the repealed Act remains in force as if made under this Act until revoked or replaced." },
      ],
    },
  ],
  schedule: {
    title: "Schedule — Constitution and Proceedings of the Board",
    sections: [
      { number: 1, title: "Membership and tenure", detail: "The Board consists of a Chairman and at least six but not more than nine other members appointed by the Minister. Membership includes contractor representatives, a legally qualified Attorney General’s Office representative, a Works Ministry professional, representatives from the Architectural Association of Tanzania, the Association of Consulting Engineers Tanzania and the Tanzania Institute of Quantity Surveyors, plus a business-community member. Members ordinarily serve at least three years, may resign by written notice, may be re-appointed, and one third of members may be phased out at the end of a three-year term." },
      { number: 2, title: "Election of Vice-Chairman", detail: "Members elect a Vice-Chairman from among themselves." },
      { number: 3, title: "Meetings of Board", detail: "The Board must meet at least six times each year. Meetings are convened by the Chairman, or by the Vice-Chairman when the Chairman is absent, unavailable or incapacitated. A special meeting must be convened within twenty-one days after a written request signed by at least a simple majority of the Board." },
      { number: 4, title: "Quorum and voting", detail: "A simple majority of members in office forms a quorum. Decisions are made by resolution of members present; the majority decision is the Board’s decision. Each member has one vote, and the meeting chair has a second or casting vote in a tie. The Board may decide matters by circulation of papers and written views unless a member requires consideration at a meeting; a strong objection must be recorded in the minutes." },
      { number: 5, title: "Minutes of meetings", detail: "Proper minutes must be kept and signed by the Chairman and Secretary after adoption by the Board." },
      { number: 6, title: "Procedures", detail: "Subject to the Schedule and regulations, the Board may regulate its own procedure." },
      { number: 7, title: "Seal of Board", detail: "The Board seal may only be affixed in the presence of the Chairman, Vice-Chairman, Secretary and one other Board member." },
      { number: 8, title: "Registrar as Secretary", detail: "The Registrar acts as Secretary of the Board and may attend and speak at meetings but may not vote." },
      { number: 9, title: "Staff of Board", detail: "The Board may appoint officers it considers necessary on terms and conditions prescribed by regulations or by-laws made under the Act." },
    ],
  },
} as const;

export const BUILD_PHASES = [
  {
    id: "site",
    title: "Maandalizi ya kwanja & Msingi",
    share: 0.22,
    weeks: 4,
    tasks: [
      "Pima kiwanja na weka pegs",
      "Safisha kwanja na uchimbe msingi",
      "Weka nondo za msingi na kumwaga concrete",
      "Jaza na compact backfill",
    ],
  },
  {
    id: "walls",
    title: "Kuinua kuta & Kumwaga jamvi",
    share: 0.32,
    weeks: 6,
    tasks: [
      "Jenga kuta hadi window sill",
      "Weka fremu za madirisha",
      "Maliza kuta na ring beam",
      "Simika formwork na kumwaga slab/jamvi",
    ],
  },
  {
    id: "roof",
    title: "Paa & Kufunga dirisha",
    share: 0.18,
    weeks: 4,
    tasks: [
      "Simika trusses / mbao za paa",
      "Piga bati na valleys",
      "Weka madirisha na milango",
      "Funga fascia na gutters",
    ],
  },
  {
    id: "finish",
    title: "Finishes, rangi & mfumo wa maji/umeme",
    share: 0.28,
    weeks: 8,
    tasks: [
      "Plumbing na wiring rough-in",
      "Plaster ya ndani na nje",
      "Tiles za bafu na sebuleni",
      "Rangi, gypsum, fixtures na usafi wa mwisho",
    ],
  },
];

export const FEATURES = [
  {
    id: "mshauri",
    href: "/anza/mshauri",
    title: "Mshauri wa Ujenzi",
    body: "AI inakusaidia kupanga muundo, idadi ya vyumba na mwelekeo bora wa nyumba yako kulingana na eneo husika.",
  },
  {
    id: "design",
    href: "/anza/design",
    title: "Design Home Studio",
    body: "Tengeneza na hariri nyumba yako katika 2D na 3D, kisha angalia ramani, elevations na paa kutoka kwenye muundo mmoja.",
  },
  {
    id: "gharama",
    href: "/anza/gharama",
    title: "Kikokotoo cha Gharama",
    body: "Pata makadirio sahihi ya bajeti ya ujenzi kwa gharama za sasa za mikoa yote ya Tanzania.",
  },
  {
    id: "vifaa",
    href: "/anza/vifaa",
    title: "Kikokotoo cha Vifaa",
    body: "Hesabu kiasi sahihi cha mfuko wa saruji, nondo, mchanga, lori za kokoto, na idadi ya mabati.",
  },
  {
    id: "engineer",
    href: "/anza/engineer",
    title: "Site Engineer AI",
    body: "Ushauri wa kitaalamu kuhusu uchimbaji wa msingi, kumwaga jamvi, ujenzi wa nguzo, nondo za beam, na slab.",
  },
  {
    id: "interior",
    href: "/anza/interior",
    title: "Interior Designer",
    body: "Mapendekezo ya kisasa ya rangi za kuta, muundo wa dari (gypsum), samani zinazofaa, na mapazia ya kisasa.",
  },
  {
    id: "mradi",
    href: "/anza/mradi",
    title: "Meneja wa Mradi",
    body: "Fuatilia maendeleo ya ujenzi wako, tengeneza ratiba ya mafundi, na simamia bajeti isizidi kiwango kilichopangwa.",
  },
  {
    id: "sheria",
    href: "/anza/sheria",
    title: "Sheria za Ujenzi",
    body: "Fahamu kanuni zote za ujenzi Tanzania, taratibu za kupata vibali kutoka manispaa, na mikataba salama ya mafundi.",
  },
  {
    id: "agiza",
    href: "/anza/agiza",
    title: "Agiza Vifaa",
    body: "Nunua vifaa vya ujenzi vyenye ubora wa hali ya juu moja kwa moja kutoka kwa wazalishaji waliothibitishwa Tanzania.",
  },
  {
    id: "wataalamu",
    href: "/anza/wataalamu",
    title: "Ongea na Mtaalamu",
    body: "Unganishwa hapa papo na wasanifu majengo (architects) na wahandisi waliothibitishwa nchini kwa ukaguzi wa mwisho.",
  },
] as const;
