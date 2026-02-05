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


def get_vertical_specific_fields(vertical: str) -> str:
    """
    Get vertical-specific data extraction fields for the JSON response.
    
    Args:
        vertical: The vertical identifier
        
    Returns:
        JSON schema string for vertical-specific fields
    """
    vertical_fields = {
        "legal": """
    "datos_especificos_legal": {{
      "partes_contrato": [
        {{"nombre": "Parte A", "rol": "Contratante", "identificacion": "ID/NIF"}}
      ],
      "clausulas_importantes": [
        {{"numero": "5.2", "titulo": "Confidencialidad", "resumen": "descripción breve"}}
      ],
      "plazos_vencimientos": [
        {{"fecha": "YYYY-MM-DD", "concepto": "Vencimiento de contrato", "dias_restantes": 30}}
      ],
      "obligaciones_principales": [
        {{"parte": "Parte A", "obligacion": "descripción", "plazo": "30 días"}}
      ],
      "penalizaciones": [
        {{"concepto": "Incumplimiento", "monto": "1000.00", "condiciones": "descripción"}}
      ],
      "jurisdiccion": "País/Estado aplicable",
      "ley_aplicable": "Ley que rige el contrato",
      "renovacion_automatica": true/false,
      "confidencialidad": true/false
    }},""",
        
        "finance": """
    "datos_especificos_finanzas": {{
      "metricas_financieras": {{
        "ingresos_totales": {{"valor": 0, "moneda": "USD", "periodo": "Q1 2024"}},
        "gastos_totales": {{"valor": 0, "moneda": "USD", "periodo": "Q1 2024"}},
        "utilidad_neta": {{"valor": 0, "moneda": "USD", "periodo": "Q1 2024"}},
        "ebitda": {{"valor": 0, "moneda": "USD", "periodo": "Q1 2024"}},
        "flujo_caja": {{"valor": 0, "moneda": "USD", "periodo": "Q1 2024"}}
      }},
      "ratios_financieros": [
        {{"nombre": "ROI", "valor": "15%", "interpretacion": "Bueno/Regular/Malo"}},
        {{"nombre": "Liquidez", "valor": "2.5", "interpretacion": "descripción"}}
      ],
      "cuentas_principales": [
        {{"cuenta": "Activos Corrientes", "valor": 0, "moneda": "USD"}},
        {{"cuenta": "Pasivos Corrientes", "valor": 0, "moneda": "USD"}}
      ],
      "proyecciones": [
        {{"periodo": "2024", "concepto": "Ingresos", "valor_proyectado": 0}}
      ],
      "riesgos_financieros": [
        {{"tipo": "Liquidez", "nivel": "Alto/Medio/Bajo", "descripcion": "detalle"}}
      ],
      "auditoria": {{
        "fecha_ultima": "YYYY-MM-DD",
        "resultado": "Sin observaciones/Con observaciones",
        "observaciones": ["observación 1", "observación 2"]
      }}
    }},""",
        
        "healthcare": """
    "datos_especificos_salud": {{
      "pacientes": [
        {{"id_paciente": "ID anonimizado", "edad": 0, "genero": "M/F/Otro"}}
      ],
      "diagnosticos": [
        {{"codigo_icd": "A00.0", "descripcion": "Diagnóstico", "fecha": "YYYY-MM-DD"}}
      ],
      "tratamientos": [
        {{"nombre": "Tratamiento", "dosis": "cantidad", "frecuencia": "cada X horas", "duracion": "X días"}}
      ],
      "medicamentos": [
        {{"nombre": "Medicamento", "principio_activo": "activo", "via_administracion": "oral/IV/etc"}}
      ],
      "procedimientos": [
        {{"nombre": "Procedimiento", "fecha": "YYYY-MM-DD", "resultado": "exitoso/complicaciones"}}
      ],
      "profesionales_salud": [
        {{"nombre": "Dr. X", "especialidad": "Cardiología", "licencia": "número"}}
      ],
      "cumplimiento_hipaa": true/false,
      "nivel_urgencia": "Bajo/Medio/Alto/Crítico",
      "seguimiento_requerido": true/false,
      "fecha_proximo_control": "YYYY-MM-DD"
    }},""",
        
        "hr": """
    "datos_especificos_rrhh": {{
      "empleados": [
        {{"id_empleado": "EMP001", "nombre": "Nombre", "puesto": "Cargo", "departamento": "Área"}}
      ],
      "posiciones": [
        {{"titulo": "Cargo", "departamento": "Área", "nivel": "Junior/Senior", "vacantes": 1}}
      ],
      "salarios": [
        {{"puesto": "Cargo", "rango_min": 0, "rango_max": 0, "moneda": "USD", "periodo": "mensual/anual"}}
      ],
      "beneficios": [
        {{"tipo": "Seguro médico", "descripcion": "detalle", "costo_empresa": 0}}
      ],
      "evaluaciones_desempeño": [
        {{"empleado_id": "EMP001", "periodo": "2024-Q1", "calificacion": "Excelente/Bueno/Regular", "comentarios": "texto"}}
      ],
      "capacitaciones": [
        {{"nombre": "Curso", "duracion_horas": 0, "fecha_inicio": "YYYY-MM-DD", "participantes": 0}}
      ],
      "incidentes_laborales": [
        {{"fecha": "YYYY-MM-DD", "tipo": "Accidente/Queja/Otro", "gravedad": "Leve/Moderado/Grave", "estado": "Abierto/Cerrado"}}
      ],
      "rotacion_personal": {{
        "ingresos": 0,
        "egresos": 0,
        "tasa_rotacion": "0%",
        "periodo": "2024-Q1"
      }}
    }},""",
        
        "retail": """
    "datos_especificos_retail": {{
      "productos": [
        {{"sku": "SKU001", "nombre": "Producto", "categoria": "Categoría", "precio": 0, "stock": 0}}
      ],
      "ventas": [
        {{"fecha": "YYYY-MM-DD", "producto_sku": "SKU001", "cantidad": 0, "monto_total": 0, "canal": "Online/Tienda"}}
      ],
      "inventario": [
        {{"sku": "SKU001", "ubicacion": "Almacén A", "cantidad_actual": 0, "punto_reorden": 0, "estado": "Disponible/Agotado"}}
      ],
      "promociones": [
        {{"nombre": "Promoción", "descuento": "20%", "fecha_inicio": "YYYY-MM-DD", "fecha_fin": "YYYY-MM-DD", "productos_aplicables": ["SKU001"]}}
      ],
      "metricas_ventas": {{
        "ventas_totales": {{"valor": 0, "moneda": "USD", "periodo": "mes"}},
        "ticket_promedio": {{"valor": 0, "moneda": "USD"}},
        "conversion_rate": "0%",
        "clientes_nuevos": 0,
        "clientes_recurrentes": 0
      }},
      "proveedores": [
        {{"nombre": "Proveedor", "productos": ["SKU001"], "tiempo_entrega_dias": 0, "calificacion": "A/B/C"}}
      ],
      "devoluciones": [
        {{"fecha": "YYYY-MM-DD", "producto_sku": "SKU001", "motivo": "Defecto/Insatisfacción", "monto": 0}}
      ]
    }},""",
        
        "manufacturing": """
    "datos_especificos_manufactura": {{
      "lineas_produccion": [
        {{"nombre": "Línea A", "capacidad_diaria": 0, "utilizacion": "85%", "estado": "Operativa/Mantenimiento"}}
      ],
      "productos_fabricados": [
        {{"codigo": "PROD001", "nombre": "Producto", "unidades_producidas": 0, "fecha": "YYYY-MM-DD"}}
      ],
      "materias_primas": [
        {{"nombre": "Material", "cantidad_disponible": 0, "unidad": "kg/unidades", "proveedor": "Proveedor A", "costo_unitario": 0}}
      ],
      "control_calidad": [
        {{"lote": "LOTE001", "fecha_inspeccion": "YYYY-MM-DD", "unidades_inspeccionadas": 0, "defectos_encontrados": 0, "tasa_defectos": "0%"}}
      ],
      "mantenimiento": [
        {{"equipo": "Máquina A", "tipo": "Preventivo/Correctivo", "fecha": "YYYY-MM-DD", "duracion_horas": 0, "costo": 0}}
      ],
      "eficiencia_produccion": {{
        "oee": "85%",
        "disponibilidad": "90%",
        "rendimiento": "95%",
        "calidad": "99%",
        "periodo": "2024-01"
      }},
      "incidentes_seguridad": [
        {{"fecha": "YYYY-MM-DD", "tipo": "Accidente/Casi accidente", "gravedad": "Leve/Moderado/Grave", "area": "Línea A"}}
      ],
      "desperdicios": [
        {{"tipo": "Scrap/Retrabajo", "cantidad": 0, "costo_estimado": 0, "causa": "descripción"}}
      ]
    }},""",
        
        "technology": """
    "datos_especificos_tecnologia": {{
      "sistemas": [
        {{"nombre": "Sistema A", "version": "1.0.0", "estado": "Producción/Desarrollo", "criticidad": "Alta/Media/Baja"}}
      ],
      "apis": [
        {{"nombre": "API REST", "endpoint": "/api/v1/resource", "metodo": "GET/POST", "autenticacion": "OAuth2/API Key"}}
      ],
      "bases_datos": [
        {{"nombre": "PostgreSQL", "version": "14.0", "tamaño_gb": 0, "backup_frecuencia": "diario"}}
      ],
      "infraestructura": [
        {{"recurso": "Servidor Web", "tipo": "EC2/Lambda", "region": "us-east-1", "costo_mensual": 0}}
      ],
      "vulnerabilidades": [
        {{"id": "CVE-2024-XXXX", "severidad": "Crítica/Alta/Media/Baja", "componente": "Librería X", "estado": "Abierta/Mitigada/Cerrada"}}
      ],
      "metricas_rendimiento": {{
        "tiempo_respuesta_ms": 0,
        "disponibilidad": "99.9%",
        "throughput_rps": 0,
        "error_rate": "0.1%"
      }},
      "dependencias": [
        {{"nombre": "Librería", "version": "1.0.0", "licencia": "MIT/Apache", "vulnerabilidades_conocidas": 0}}
      ],
      "integraciones": [
        {{"sistema_externo": "Sistema B", "protocolo": "REST/SOAP/GraphQL", "frecuencia": "tiempo real/batch"}}
      ]
    }},""",
        
        "education": """
    "datos_especificos_educacion": {{
      "cursos": [
        {{"codigo": "CS101", "nombre": "Introducción a la Programación", "creditos": 3, "nivel": "Básico/Intermedio/Avanzado"}}
      ],
      "estudiantes": [
        {{"id": "EST001", "nombre": "Estudiante", "programa": "Ingeniería", "semestre": 1, "promedio": 0}}
      ],
      "docentes": [
        {{"nombre": "Prof. X", "especialidad": "Matemáticas", "cursos_asignados": ["MAT101"], "carga_horaria": 0}}
      ],
      "evaluaciones": [
        {{"curso": "CS101", "tipo": "Examen/Tarea/Proyecto", "fecha": "YYYY-MM-DD", "peso_porcentaje": 0, "promedio_clase": 0}}
      ],
      "asistencia": [
        {{"curso": "CS101", "fecha": "YYYY-MM-DD", "estudiantes_presentes": 0, "estudiantes_totales": 0, "porcentaje": "0%"}}
      ],
      "recursos_educativos": [
        {{"tipo": "Libro/Video/Software", "nombre": "Recurso", "disponibilidad": "Disponible/Agotado", "costo": 0}}
      ],
      "infraestructura": [
        {{"tipo": "Aula/Laboratorio/Biblioteca", "capacidad": 0, "equipamiento": ["Proyector", "Computadoras"], "estado": "Operativo/Mantenimiento"}}
      ],
      "programas_academicos": [
        {{"nombre": "Ingeniería en Sistemas", "duracion_semestres": 10, "estudiantes_activos": 0, "tasa_graduacion": "0%"}}
      ]
    }},"""
    }
    
    return vertical_fields.get(vertical, "")


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
    vertical_fields = get_vertical_specific_fields(vertical)
    
    prompt = f"""Eres un analista experto especializado en la industria de {template.name}.

Analiza el siguiente documento y proporciona un análisis completo EN ESPAÑOL con extracción estructurada de datos.

{template.specific_instructions}

Contenido del Documento:
{document_text}

CRÍTICO: Debes responder ÚNICAMENTE con JSON válido. No incluyas texto explicativo, formato markdown, ni bloques de código. Devuelve SOLO el objeto JSON puro.

IMPORTANTE: 
- TODO el análisis debe estar en ESPAÑOL
- Extrae TODOS los datos estructurados relevantes del documento
- Identifica y extrae entidades específicas del dominio (nombres, fechas, valores, referencias)
- El JSON debe ser consumible por otros microservicios
- Si no encuentras información para un campo, usa array vacío [] o null

Formato JSON requerido:
{{
  "resumen_ejecutivo": "Tu resumen de 2-3 párrafos aquí en español, destacando los puntos más importantes del documento",
  "puntos_clave": [
    "punto 1 en español - información crítica extraída",
    "punto 2 en español - hallazgo importante",
    "punto 3 en español - dato relevante",
    "punto 4 en español - observación significativa",
    "punto 5 en español - conclusión principal"
  ],
  "analisis_detallado": {{
    "contexto": "Descripción del contexto y propósito del documento",
    "hallazgos_principales": [
      "hallazgo 1 con detalles",
      "hallazgo 2 con detalles",
      "hallazgo 3 con detalles"
    ],
    "areas_atencion": [
      "área que requiere atención 1",
      "área que requiere atención 2"
    ],
    "fortalezas": [
      "fortaleza identificada 1",
      "fortaleza identificada 2"
    ],
    "oportunidades_mejora": [
      "oportunidad 1",
      "oportunidad 2"
    ]
  }},
  "proximos_pasos": [
    "paso 1 en español - acción concreta recomendada",
    "paso 2 en español - siguiente acción sugerida",
    "paso 3 en español - acción de seguimiento"
  ],
  "datos_extraidos": {{
    "nombres_personas": ["nombre completo 1", "nombre completo 2"],
    "nombres_empresas": ["empresa 1", "empresa 2"],
    "fechas_importantes": [
      {{"fecha": "YYYY-MM-DD", "descripcion": "descripción detallada del evento o hito", "tipo": "vencimiento/inicio/fin/otro"}},
      {{"fecha": "YYYY-MM-DD", "descripcion": "descripción del evento", "tipo": "tipo de fecha"}}
    ],
    "valores_monetarios": [
      {{"monto": "1000.00", "moneda": "USD", "concepto": "descripción detallada del concepto", "tipo": "ingreso/gasto/inversión/otro"}},
      {{"monto": "2000.00", "moneda": "USD", "concepto": "concepto", "tipo": "tipo"}}
    ],
    "numeros_referencia": [
      {{"numero": "REF-001", "tipo": "factura/contrato/orden/otro", "descripcion": "descripción"}}
    ],
    "ubicaciones": [
      {{"direccion": "dirección completa", "ciudad": "ciudad", "pais": "país", "tipo": "oficina/sucursal/otro"}}
    ],
    "contactos": [
      {{"nombre": "nombre", "email": "email@example.com", "telefono": "+1234567890", "cargo": "cargo/rol"}}
    ],
    "porcentajes_metricas": [
      {{"metrica": "nombre de la métrica", "valor": "15%", "contexto": "descripción del contexto"}}
    ]
  }},{vertical_fields}
  "riesgos_identificados": [
    {{"tipo": "Legal/Financiero/Operacional/Otro", "nivel": "Alto/Medio/Bajo", "descripcion": "descripción detallada del riesgo", "impacto": "descripción del impacto potencial", "mitigacion": "sugerencia de mitigación"}}
  ],
  "cumplimiento_normativo": {{
    "regulaciones_aplicables": ["regulación 1", "regulación 2"],
    "estado_cumplimiento": "Cumple/Cumple parcialmente/No cumple/No aplica",
    "observaciones": ["observación 1", "observación 2"],
    "acciones_requeridas": ["acción 1", "acción 2"]
  }},
  "metadatos": {{
    "tipo_documento": "tipo específico identificado (contrato, informe, factura, etc.)",
    "idioma_original": "idioma del documento",
    "nivel_confianza": "alto/medio/bajo",
    "requiere_revision_humana": true/false,
    "razon_revision": "explicación si requiere revisión humana",
    "fecha_documento": "YYYY-MM-DD si se puede identificar",
    "version_documento": "versión si aplica",
    "confidencialidad": "Pública/Interna/Confidencial/Restringida"
  }}
}}

NOTA IMPORTANTE: 
- Extrae TODOS los datos relevantes que encuentres en el documento
- Si un campo no tiene información, usa [] para arrays o null para valores individuales
- Sé exhaustivo en la extracción de entidades (nombres, fechas, valores, referencias)
- Los campos específicos del vertical son OPCIONALES - solo llénalos si encuentras información relevante
- Prioriza la precisión sobre la completitud - es mejor dejar un campo vacío que inventar información

SECCIONES ADICIONALES MEJORADAS:

  "analisis_sentimiento": {{
    "tono_general": "Positivo/Neutral/Negativo/Mixto",
    "nivel_formalidad": "Muy formal/Formal/Informal/Coloquial",
    "urgencia_detectada": "Crítica/Alta/Media/Baja/Ninguna",
    "confianza_analisis": "Alta/Media/Baja",
    "indicadores_clave": ["indicador 1", "indicador 2"]
  }},
  "relaciones_entidades": [
    {{
      "entidad_origen": "Nombre de entidad 1",
      "tipo_origen": "persona/empresa/ubicacion/otro",
      "relacion": "descripción de la relación (ej: es empleado de, firma contrato con, etc.)",
      "entidad_destino": "Nombre de entidad 2",
      "tipo_destino": "persona/empresa/ubicacion/otro",
      "contexto": "contexto adicional de la relación",
      "confianza": "Alta/Media/Baja"
    }}
  ],
  "linea_tiempo": [
    {{
      "fecha": "YYYY-MM-DD",
      "evento": "descripción del evento",
      "tipo": "hito/deadline/inicio/fin/pago/revision/otro",
      "importancia": "Crítica/Alta/Media/Baja",
      "partes_involucradas": ["entidad 1", "entidad 2"],
      "estado": "Completado/Pendiente/Próximo/Vencido",
      "dias_restantes": 0
    }}
  ],
  "validaciones_datos": {{
    "fechas_consistentes": true/false,
    "montos_completos": true/false,
    "referencias_validas": true/false,
    "datos_faltantes": ["campo 1", "campo 2"],
    "inconsistencias_detectadas": ["inconsistencia 1", "inconsistencia 2"],
    "nivel_completitud": "0-100%"
  }},
  "calculos_automaticos": {{
    "total_valores_monetarios": {{"valor": 0, "moneda": "USD"}},
    "promedio_valores": {{"valor": 0, "moneda": "USD"}},
    "cantidad_fechas_futuras": 0,
    "cantidad_fechas_pasadas": 0,
    "dias_hasta_proximo_evento": 0,
    "duracion_total_dias": 0,
    "cantidad_entidades_unicas": 0,
    "metricas_adicionales": [
      {{"nombre": "métrica", "valor": "valor", "unidad": "unidad"}}
    ]
  }},
  "patrones_identificados": [
    {{
      "tipo": "Temporal/Financiero/Operacional/Otro",
      "patron": "descripción del patrón detectado",
      "frecuencia": "Diaria/Semanal/Mensual/Anual/Única",
      "ejemplos": ["ejemplo 1", "ejemplo 2"],
      "confianza": "Alta/Media/Baja",
      "relevancia": "Alta/Media/Baja"
    }}
  ],
  "alertas_automaticas": [
    {{
      "nivel": "Crítico/Alto/Medio/Bajo/Informativo",
      "categoria": "Vencimiento/Cumplimiento/Financiero/Operacional/Otro",
      "titulo": "título breve de la alerta",
      "mensaje": "descripción detallada de la alerta",
      "fecha_alerta": "YYYY-MM-DD",
      "accion_requerida": "acción específica recomendada",
      "responsable_sugerido": "rol o departamento responsable",
      "plazo_accion": "inmediato/1-7 días/1-4 semanas/1-3 meses"
    }}
  ],
  "recomendaciones_priorizadas": [
    {{
      "prioridad": 1,
      "categoria": "Urgente/Importante/Normal/Opcional",
      "titulo": "título de la recomendación",
      "descripcion": "descripción detallada de la acción recomendada",
      "razon": "justificación de por qué es importante",
      "impacto_esperado": "Alto/Medio/Bajo",
      "esfuerzo_estimado": "Alto/Medio/Bajo",
      "responsable_sugerido": "rol o departamento",
      "plazo_sugerido": "descripción del plazo",
      "dependencias": ["dependencia 1", "dependencia 2"],
      "beneficios": ["beneficio 1", "beneficio 2"]
    }}
  ],
  "comparacion_contexto": {{
    "tipo_documento_identificado": "tipo específico del documento",
    "complejidad_documento": "Alta/Media/Baja",
    "nivel_detalle": "Muy detallado/Detallado/Moderado/Básico",
    "calidad_informacion": "Excelente/Buena/Regular/Pobre",
    "areas_bien_documentadas": ["área 1", "área 2"],
    "areas_poco_documentadas": ["área 1", "área 2"],
    "sugerencias_mejora_documento": ["sugerencia 1", "sugerencia 2"]
  }},
  "indicadores_clave_rendimiento": [
    {{
      "nombre": "nombre del KPI",
      "valor_actual": "valor extraído del documento",
      "unidad": "unidad de medida",
      "tendencia": "Mejorando/Estable/Empeorando/No disponible",
      "interpretacion": "interpretación del valor",
      "benchmark_industria": "valor de referencia si aplica",
      "estado": "Excelente/Bueno/Aceptable/Preocupante/Crítico"
    }}
  ]
}}

INSTRUCCIONES FINALES:
- Analiza el documento de forma exhaustiva y profesional
- Extrae TODOS los datos estructurados posibles
- Genera alertas para situaciones que requieren atención
- Prioriza recomendaciones por impacto y urgencia
- Identifica patrones y tendencias en los datos
- Valida la consistencia de la información extraída
- Proporciona análisis contextual y comparativo
- Si no hay información para una sección, usa arrays vacíos [] o valores null
- Mantén TODO el análisis en ESPAÑOL
"""
    
    return prompt
