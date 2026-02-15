### **Success response (exact JSON example)**

`{`  
  `"ok": true,`  
  `"jobContextSchemaVersion": "1.0",`  
  `"language": "en",`  
  `"jobContext": {`  
    `"roleTitle": "Product Manager",`  
    `"seniority": "mid",`  
    `"surfaces": ["app", "web"],`  
    `"topPriorities": [`  
      `{ "signal": "Drive product strategy and roadmap execution", "weight": 5 },`  
      `{ "signal": "Collaborate cross-functionally with engineering and design", "weight": 4 },`  
      `{ "signal": "Use customer insights and data to guide decisions", "weight": 4 }`  
    `],`  
    `"mustHave": [`  
      `"Experience owning a product roadmap end to end",`  
      `"Ability to translate business goals into product requirements",`  
      `"Strong stakeholder management and communication skills",`  
      `"Experience working with engineering and design teams",`  
      `"Ability to prioritize work using impact and effort"`  
    `],`  
    `"successMetrics": [`  
      `"Improved user activation rate",`  
      `"Increased retention over 90 days",`  
      `"Reduced time to complete key workflows"`  
    `],`  
    `"keywords": [`  
      `"product strategy",`  
      `"roadmap",`  
      `"stakeholder management",`  
      `"cross-functional",`  
      `"user research",`  
      `"prioritization",`  
      `"experimentation",`  
      `"KPIs",`  
      `"metrics",`  
      `"data-driven"`  
    `],`  
    `"tone": "data-driven"`  
  `}`  
`}`

### **Failure response (exact JSON example)**

`{`  
  `"ok": false,`  
  `"jobContextSchemaVersion": "1.0",`  
  `"contractError": {`  
    `"code": "INVALID_INPUT",`  
    `"message": "Missing required job ad text."`  
  `}`  
`}`  
