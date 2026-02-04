"""
Vertical Templates Module

Defines industry-specific templates for document analysis with Amazon Bedrock.
Each template contains specialized instructions to guide the AI analysis
based on the business vertical.

Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class VerticalTemplate:
    """
    Represents a vertical-specific template for document analysis.
    
    Attributes:
        vertical: The industry vertical identifier
        name: Human-readable name of the vertical
        description: Brief description of the vertical
        focus_areas: Key areas of focus for this vertical
        specific_instructions: Detailed instructions for AI analysis
        key_terms: Industry-specific terminology to emphasize
    """
    vertical: str
    name: str
    description: str
    focus_areas: List[str]
    specific_instructions: str
    key_terms: List[str]


# Healthcare Template
HEALTHCARE_TEMPLATE = VerticalTemplate(
    vertical="healthcare",
    name="Healthcare",
    description="Medical and healthcare industry analysis",
    focus_areas=[
        "Patient care and outcomes",
        "HIPAA compliance and privacy",
        "Medical terminology and procedures",
        "Clinical protocols and guidelines",
        "Healthcare regulations"
    ],
    specific_instructions="""
Focus on patient care quality, safety protocols, and clinical outcomes.
Pay special attention to:
- Patient safety and care quality indicators
- Compliance with HIPAA and healthcare regulations
- Medical terminology, diagnoses, and treatment plans
- Clinical protocols and best practices
- Risk management and patient privacy
- Healthcare delivery efficiency
- Medical staff coordination and communication

Highlight any compliance issues, patient safety concerns, or opportunities
to improve care quality. Use appropriate medical terminology and consider
regulatory requirements in your analysis.
""",
    key_terms=[
        "patient outcomes", "HIPAA", "clinical protocols", "medical records",
        "treatment plans", "patient safety", "healthcare compliance",
        "clinical guidelines", "medical terminology", "care quality"
    ]
)


# Education Template
EDUCATION_TEMPLATE = VerticalTemplate(
    vertical="education",
    name="Education",
    description="Educational institutions and learning programs",
    focus_areas=[
        "Learning outcomes and objectives",
        "Curriculum design and alignment",
        "Student engagement and participation",
        "Assessment and evaluation methods",
        "Educational standards compliance"
    ],
    specific_instructions="""
Focus on learning effectiveness, curriculum quality, and student engagement.
Pay special attention to:
- Learning objectives and educational outcomes
- Curriculum alignment with standards
- Student engagement and participation strategies
- Assessment methods and evaluation criteria
- Teaching methodologies and pedagogical approaches
- Educational technology integration
- Student performance and achievement metrics
- Accessibility and inclusive education practices

Highlight opportunities to improve learning outcomes, enhance student
engagement, or align with educational standards. Consider diverse learning
needs and modern pedagogical best practices.
""",
    key_terms=[
        "learning outcomes", "curriculum", "student engagement", "assessment",
        "pedagogy", "educational standards", "teaching methods",
        "student performance", "learning objectives", "educational technology"
    ]
)


# Retail Template
RETAIL_TEMPLATE = VerticalTemplate(
    vertical="retail",
    name="Retail",
    description="Retail operations and customer experience",
    focus_areas=[
        "Sales performance and metrics",
        "Inventory management",
        "Customer experience and satisfaction",
        "Merchandising and product placement",
        "Retail operations efficiency"
    ],
    specific_instructions="""
Focus on sales performance, customer experience, and operational efficiency.
Pay special attention to:
- Sales metrics, trends, and performance indicators
- Inventory levels, turnover, and supply chain
- Customer satisfaction and shopping experience
- Product merchandising and placement strategies
- Point-of-sale operations and transactions
- Customer service quality and responsiveness
- Retail analytics and business intelligence
- Omnichannel retail strategies

Highlight opportunities to increase sales, improve customer satisfaction,
optimize inventory, or enhance operational efficiency. Consider both
in-store and online retail dynamics.
""",
    key_terms=[
        "sales performance", "inventory management", "customer experience",
        "merchandising", "retail operations", "customer satisfaction",
        "supply chain", "point-of-sale", "retail analytics", "omnichannel"
    ]
)


# Legal Template
LEGAL_TEMPLATE = VerticalTemplate(
    vertical="legal",
    name="Legal",
    description="Legal documents and compliance analysis",
    focus_areas=[
        "Contract terms and conditions",
        "Legal compliance and regulations",
        "Risk assessment and liability",
        "Legal obligations and rights",
        "Dispute resolution and litigation"
    ],
    specific_instructions="""
Focus on legal implications, contractual obligations, and compliance requirements.
Pay special attention to:
- Contract terms, clauses, and conditions
- Legal obligations, rights, and responsibilities
- Compliance with laws and regulations
- Risk assessment and potential liabilities
- Dispute resolution mechanisms
- Legal precedents and case law references
- Intellectual property considerations
- Regulatory compliance requirements

Highlight any legal risks, compliance issues, ambiguous terms, or areas
requiring legal review. Use precise legal terminology and identify key
contractual obligations and deadlines.
""",
    key_terms=[
        "contract terms", "legal compliance", "liability", "obligations",
        "regulations", "dispute resolution", "legal risk", "contractual",
        "intellectual property", "regulatory requirements"
    ]
)


# Finance Template
FINANCE_TEMPLATE = VerticalTemplate(
    vertical="finance",
    name="Finance",
    description="Financial analysis and regulatory compliance",
    focus_areas=[
        "Financial metrics and performance",
        "Risk analysis and management",
        "Regulatory compliance (SEC, SOX, etc.)",
        "Financial reporting and statements",
        "Investment and portfolio analysis"
    ],
    specific_instructions="""
Focus on financial performance, risk management, and regulatory compliance.
Pay special attention to:
- Financial metrics, ratios, and performance indicators
- Revenue, expenses, profitability, and cash flow
- Risk assessment and mitigation strategies
- Regulatory compliance (SEC, SOX, GAAP, IFRS)
- Financial reporting accuracy and transparency
- Investment analysis and portfolio performance
- Audit findings and internal controls
- Financial forecasting and projections

Highlight financial risks, compliance issues, performance trends, or
opportunities for financial optimization. Use standard financial terminology
and consider regulatory requirements.
""",
    key_terms=[
        "financial metrics", "risk management", "regulatory compliance",
        "financial reporting", "profitability", "cash flow", "audit",
        "SEC compliance", "financial performance", "investment analysis"
    ]
)


# Manufacturing Template
MANUFACTURING_TEMPLATE = VerticalTemplate(
    vertical="manufacturing",
    name="Manufacturing",
    description="Manufacturing operations and supply chain",
    focus_areas=[
        "Operations efficiency and productivity",
        "Quality control and assurance",
        "Supply chain management",
        "Production planning and scheduling",
        "Manufacturing safety and compliance"
    ],
    specific_instructions="""
Focus on operational efficiency, quality control, and supply chain optimization.
Pay special attention to:
- Production efficiency and throughput metrics
- Quality control processes and defect rates
- Supply chain logistics and vendor management
- Equipment maintenance and downtime
- Manufacturing safety protocols and compliance
- Inventory management and material flow
- Production planning and capacity utilization
- Lean manufacturing and continuous improvement

Highlight opportunities to improve efficiency, reduce defects, optimize
supply chain, or enhance safety. Consider industry standards and best
practices in manufacturing operations.
""",
    key_terms=[
        "operations efficiency", "quality control", "supply chain",
        "production planning", "manufacturing safety", "throughput",
        "defect rates", "lean manufacturing", "capacity utilization",
        "continuous improvement"
    ]
)


# HR Template
HR_TEMPLATE = VerticalTemplate(
    vertical="hr",
    name="Human Resources",
    description="HR policies and talent management",
    focus_areas=[
        "Talent management and recruitment",
        "HR policies and procedures",
        "Employee engagement and satisfaction",
        "Performance management",
        "Compliance with labor laws"
    ],
    specific_instructions="""
Focus on talent management, employee engagement, and HR policy compliance.
Pay special attention to:
- Recruitment and talent acquisition strategies
- Employee engagement and satisfaction levels
- Performance management and evaluation processes
- HR policies, procedures, and handbooks
- Compliance with labor laws and regulations
- Compensation and benefits programs
- Training and professional development
- Employee relations and workplace culture
- Diversity, equity, and inclusion initiatives

Highlight opportunities to improve employee engagement, enhance talent
management, ensure policy compliance, or strengthen workplace culture.
Consider legal requirements and HR best practices.
""",
    key_terms=[
        "talent management", "employee engagement", "HR policies",
        "performance management", "labor compliance", "recruitment",
        "employee satisfaction", "workplace culture", "compensation",
        "professional development"
    ]
)


# Technology Template
TECHNOLOGY_TEMPLATE = VerticalTemplate(
    vertical="technology",
    name="Technology",
    description="Technical specifications and architecture",
    focus_areas=[
        "Technical specifications and requirements",
        "System architecture and design",
        "Security and data protection",
        "Performance and scalability",
        "Technology standards and best practices"
    ],
    specific_instructions="""
Focus on technical architecture, security, and implementation details.
Pay special attention to:
- Technical specifications and system requirements
- Architecture design and component interactions
- Security measures and data protection
- Performance metrics and scalability considerations
- Code quality and technical debt
- API design and integration points
- Infrastructure and deployment strategies
- Technology stack and framework choices
- Security vulnerabilities and mitigation strategies

Highlight technical risks, security concerns, architectural decisions, or
opportunities for optimization. Use appropriate technical terminology and
consider industry best practices and standards.
""",
    key_terms=[
        "technical specifications", "system architecture", "security",
        "performance", "scalability", "API design", "infrastructure",
        "technical debt", "data protection", "technology standards"
    ]
)


# Template registry mapping vertical identifiers to templates
VERTICAL_TEMPLATES: Dict[str, VerticalTemplate] = {
    "healthcare": HEALTHCARE_TEMPLATE,
    "education": EDUCATION_TEMPLATE,
    "retail": RETAIL_TEMPLATE,
    "legal": LEGAL_TEMPLATE,
    "finance": FINANCE_TEMPLATE,
    "manufacturing": MANUFACTURING_TEMPLATE,
    "hr": HR_TEMPLATE,
    "technology": TECHNOLOGY_TEMPLATE,
}


def get_template(vertical: str) -> Optional[VerticalTemplate]:
    """
    Retrieve a vertical template by its identifier.
    
    Args:
        vertical: The vertical identifier (e.g., 'healthcare', 'education')
        
    Returns:
        VerticalTemplate object if found, None otherwise
        
    Example:
        >>> template = get_template('healthcare')
        >>> print(template.name)
        Healthcare
    """
    return VERTICAL_TEMPLATES.get(vertical.lower())


def get_all_verticals() -> List[str]:
    """
    Get a list of all available vertical identifiers.
    
    Returns:
        List of vertical identifier strings
        
    Example:
        >>> verticals = get_all_verticals()
        >>> print(verticals)
        ['healthcare', 'education', 'retail', 'legal', 'finance', 'manufacturing', 'hr', 'technology']
    """
    return list(VERTICAL_TEMPLATES.keys())


def get_template_instructions(vertical: str) -> str:
    """
    Get the specific instructions for a vertical template.
    
    Args:
        vertical: The vertical identifier
        
    Returns:
        Specific instructions string, or empty string if vertical not found
        
    Example:
        >>> instructions = get_template_instructions('healthcare')
        >>> 'patient care' in instructions.lower()
        True
    """
    template = get_template(vertical)
    return template.specific_instructions if template else ""


def validate_vertical(vertical: str) -> bool:
    """
    Validate if a vertical identifier is supported.
    
    Args:
        vertical: The vertical identifier to validate
        
    Returns:
        True if vertical is valid, False otherwise
        
    Example:
        >>> validate_vertical('healthcare')
        True
        >>> validate_vertical('invalid')
        False
    """
    return vertical.lower() in VERTICAL_TEMPLATES


def get_prompt_template(vertical: str, document_text: str) -> str:
    """
    Construct a complete prompt for Bedrock using the vertical template.
    
    Args:
        vertical: The vertical identifier
        document_text: The extracted text from the document
        
    Returns:
        Complete prompt string ready for Bedrock API
        
    Raises:
        ValueError: If vertical is not valid
        
    Example:
        >>> prompt = get_prompt_template('healthcare', 'Patient report...')
        >>> 'healthcare' in prompt.lower()
        True
    """
    if not validate_vertical(vertical):
        raise ValueError(f"Invalid vertical: {vertical}. Must be one of {get_all_verticals()}")
    
    template = get_template(vertical)
    
    prompt = f"""Eres un analista experto especializado en la industria de {template.name}.

Analiza el siguiente documento y proporciona un análisis completo EN ESPAÑOL.

{template.specific_instructions}

Contenido del Documento:
{document_text}

CRÍTICO: Debes responder ÚNICAMENTE con JSON válido. No incluyas texto explicativo, formato markdown, ni bloques de código. Devuelve SOLO el objeto JSON puro.

IMPORTANTE: 
- TODO el análisis debe estar en ESPAÑOL
- Extrae y estructura los datos clave (nombres, fechas, valores monetarios, etc.)
- El JSON debe ser consumible por otros microservicios

Formato JSON requerido:
{{
  "resumen_ejecutivo": "Tu resumen de 2-3 párrafos aquí en español",
  "puntos_clave": [
    "punto 1 en español",
    "punto 2 en español",
    "punto 3 en español",
    "punto 4 en español",
    "punto 5 en español"
  ],
  "proximos_pasos": [
    "paso 1 en español",
    "paso 2 en español",
    "paso 3 en español"
  ],
  "datos_extraidos": {{
    "nombres_personas": ["nombre1", "nombre2"],
    "nombres_empresas": ["empresa1", "empresa2"],
    "fechas_importantes": [
      {{"fecha": "YYYY-MM-DD", "descripcion": "descripción del evento"}},
      {{"fecha": "YYYY-MM-DD", "descripcion": "descripción del evento"}}
    ],
    "valores_monetarios": [
      {{"monto": "1000.00", "moneda": "USD", "concepto": "descripción"}},
      {{"monto": "2000.00", "moneda": "USD", "concepto": "descripción"}}
    ],
    "numeros_referencia": ["ref1", "ref2"],
    "ubicaciones": ["ubicación1", "ubicación2"],
    "emails": ["email1@example.com"],
    "telefonos": ["+1234567890"]
  }},
  "metadatos": {{
    "tipo_documento": "tipo identificado",
    "idioma_original": "idioma del documento",
    "nivel_confianza": "alto/medio/bajo",
    "requiere_revision_humana": true/false
  }}
}}

NOTA: Si alguna sección de datos_extraidos no tiene información relevante, devuelve un array vacío [] o un objeto vacío {{}}.
"""
    
    return prompt
