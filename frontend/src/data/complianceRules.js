export const COMPLIANCE_RULES = [
  {
    id: "RULE-001",
    category: "Branding & Visual Integrity",
    title: "Logo Usage & Safe Zone",
    severity: "High",
    description: "Official brand logos must maintain clear margins and correct aspect ratios without distortion or color alteration throughout video frames.",
  },
  {
    id: "RULE-002",
    category: "Disclaimers & OCR Text",
    title: "Mandatory On-Screen Text Visibility",
    severity: "Critical",
    description: "Legal disclaimers must be rendered in contrast-compliant text colors and stay visible on screen for a minimum duration of 3.0 seconds.",
  },
  {
    id: "RULE-003",
    category: "Audio & Speech Transcription",
    title: "Prohibited Promotional Claims",
    severity: "Critical",
    description: "Transcribed spoken audio must not contain unsubstantiated efficacy claims, misleading medical advice, or unverified financial guarantees.",
  },
  {
    id: "RULE-004",
    category: "Azure Security & Infrastructure",
    title: "Data Sovereignty & Encryption",
    severity: "Medium",
    description: "All extracted video frames, audio clips, and metadata processed through the Azure pipeline must be encrypted in transit and at rest.",
  },
  {
    id: "RULE-005",
    category: "Content Integrity",
    title: "Explicit / Restricted Media Screening",
    severity: "High",
    description: "Automated vision models screen all video frames for restricted imagery, violence, unapproved trademarks, or non-compliant third-party IP.",
  }
];