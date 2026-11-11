/* Prepared fictional sources, editorial coverage and validated proposal. No provider calls. */
window.DraftedSampleReviewData={
  "request": {
    "cvVersionId": "drafted-sample-cv-v1",
    "cvTitle": "Alex Morgan",
    "targetRole": "Product Operations Specialist",
    "language": "en",
    "blocksSchemaVersion": "1.0",
    "blocks": [
      {
        "blockId": "sample-name",
        "type": "otherSections",
        "label": "Name",
        "order": 0,
        "text": "Alex Morgan"
      },
      {
        "blockId": "sample-contact",
        "type": "otherSections",
        "label": "Contact",
        "order": 1,
        "text": "Stockholm, Sweden · alex.morgan@example.com"
      },
      {
        "blockId": "sample-profile",
        "type": "summary",
        "label": "Profile",
        "order": 10,
        "text": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
      },
      {
        "blockId": "sample-product",
        "type": "experience",
        "label": "Experience",
        "order": 20,
        "title": "Product Operations Specialist",
        "employer": "Northline Digital (fictional)",
        "startDate": "2022",
        "endDate": "Present",
        "text": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
      },
      {
        "blockId": "sample-support",
        "type": "experience",
        "label": "Experience",
        "order": 30,
        "title": "Customer Support Coordinator",
        "employer": "Harbor Services (fictional)",
        "startDate": "2019",
        "endDate": "2022",
        "text": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings."
      },
      {
        "blockId": "sample-education",
        "type": "education",
        "label": "Education",
        "order": 40,
        "degree": "BSc",
        "program": "Information Systems",
        "institution": "Example University (fictional)",
        "startDate": "2016",
        "endDate": "2019",
        "text": "Coursework in service design, databases and project coordination."
      },
      {
        "blockId": "sample-skills",
        "type": "skills",
        "label": "Skills",
        "order": 50,
        "text": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
      }
    ],
    "jobContextSchemaVersion": "1.0",
    "jobContext": {
      "roleTitle": "Product Operations Specialist",
      "seniority": "mid",
      "surfaces": [
        "web"
      ],
      "tone": "balanced",
      "topPriorities": [
        {
          "signal": "Coordinate release planning",
          "weight": 5
        },
        {
          "signal": "Bring customer feedback into prioritisation",
          "weight": 5
        },
        {
          "signal": "Collaborate with design, development and support",
          "weight": 4
        }
      ],
      "mustHave": [
        "Clear written communication",
        "Experience gathering or synthesising customer feedback",
        "Confidence with shared planning and documentation tools",
        "Professional working proficiency in English"
      ],
      "successMetrics": [],
      "keywords": [
        "release planning",
        "customer interviews",
        "documentation",
        "collaboration",
        "feedback",
        "support",
        "delivery",
        "prioritisation",
        "product operations",
        "Jira"
      ]
    },
    "sourcesSchemaVersion": "1.3",
    "sourceContext": {
      "contextRevision": "sample-context-2:8:complete:2",
      "roundId": "sample-source-3",
      "questions": [
        {
          "id": "sample-source-1",
          "question": "What did you personally coordinate in a release, and how did the team use customer feedback?",
          "signalRefs": [
            {
              "field": "topPriorities",
              "index": 0
            }
          ],
          "status": "recorded"
        },
        {
          "id": "sample-source-2",
          "question": "How did you make recurring customer questions easier for colleagues to handle?",
          "signalRefs": [
            {
              "field": "topPriorities",
              "index": 1
            }
          ],
          "status": "recorded"
        }
      ],
      "answers": [
        {
          "id": "sample-source-4",
          "questionId": "sample-source-1",
          "revision": 2,
          "text": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap.",
          "experienceContext": {
            "kind": "cv_entry",
            "cvVersionId": "drafted-sample-cv-v1",
            "blockId": "sample-product",
            "snapshot": {
              "type": "experience",
              "label": "Experience",
              "companyOrContext": "Northline Digital (fictional)",
              "roleOrProject": "Product Operations Specialist",
              "startDate": "2022",
              "endDate": "Present"
            }
          }
        },
        {
          "id": "sample-source-5",
          "questionId": "sample-source-2",
          "revision": 2,
          "text": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly.",
          "experienceContext": {
            "kind": "cv_entry",
            "cvVersionId": "drafted-sample-cv-v1",
            "blockId": "sample-support",
            "snapshot": {
              "type": "experience",
              "label": "Experience",
              "companyOrContext": "Harbor Services (fictional)",
              "roleOrProject": "Customer Support Coordinator",
              "startDate": "2019",
              "endDate": "2022"
            }
          }
        }
      ],
      "applications": []
    },
    "jobText": "Product Operations Specialist\nExample Works · Stockholm, Sweden · Hybrid\n\nAbout Example Works\nExample Works develops a digital booking platform that helps service businesses manage appointments and customer communication. Our product team works closely with customer support to understand everyday problems and turn them into practical improvements.\nWe’re looking for a Product Operations Specialist to help us bring more structure to how we plan releases, share information and use customer feedback.\n\nAbout the role\nYou’ll work alongside our Product Lead, designers and developers to keep product delivery organised and teams informed. You’ll connect customer-facing colleagues with the product team, making sure useful insights reach the right people and agreed actions are followed through.\nThis is a hands-on individual contributor role. You’ll coordinate processes and improve ways of working, while product prioritisation and roadmap decisions remain with the Product Lead.\n\nWhat you’ll do\n- Coordinate release planning, maintain delivery information and follow up on dependencies.\n- Prepare clear release updates and help customer support understand upcoming changes.\n- Bring together insights from support conversations and customer interviews.\n- Organise feedback so recurring problems can inform prioritisation discussions.\n- Maintain practical documentation, checklists and shared working routines.\n- Help the team review how releases went and identify opportunities to improve collaboration.\n\nWhat you’ll bring\n- Experience in product operations, delivery coordination, customer operations or a related role.\n- Examples of keeping cross-functional work organised and moving forward.\n- Clear written communication and an ability to make information useful for different audiences.\n- Experience gathering or synthesising customer feedback.\n- Confidence working with shared planning and documentation tools, such as Jira, Notion or similar.\n- Professional working proficiency in English.\nExperience with customer interviews, onboarding or digital booking services would be useful. We also welcome relevant experience gained in customer support or service delivery.\n\nWorking with us\nYou’ll join a small, collaborative team where improvements to everyday processes can make a visible difference. The role is based in Stockholm with a hybrid working arrangement.\n\nHow to apply\nSend your CV in English and a short introduction describing a situation where you helped a team coordinate delivery or make better use of customer feedback.",
    "integrationApplications": [],
    "signalCatalog": {
      "jobRef": {
        "jobRevisionId": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
        "jobTextHash": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
        "jobContextHash": "sha256:6df586392e09efc76fb2afa5733118c4cbbf15db58c992983f4ba64290e9a938"
      },
      "revision": "sha256:c95baefc8ccdaea8ef506621460358d93523f8a83f43449aae4fb4b468dc5236",
      "signals": [
        {
          "id": "topPriorities:0",
          "ref": {
            "field": "topPriorities",
            "index": 0
          },
          "text": "Coordinate release planning",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 999,
              "end": 1088,
              "quote": "Coordinate release planning, maintain delivery information and follow up on dependencies."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        },
        {
          "id": "topPriorities:1",
          "ref": {
            "field": "topPriorities",
            "index": 1
          },
          "text": "Bring customer feedback into prioritisation",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 1256,
              "end": 1334,
              "quote": "Organise feedback so recurring problems can inform prioritisation discussions."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        },
        {
          "id": "topPriorities:2",
          "ref": {
            "field": "topPriorities",
            "index": 2
          },
          "text": "Collaborate with design, development and support",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 518,
              "end": 637,
              "quote": "You’ll work alongside our Product Lead, designers and developers to keep product delivery organised and teams informed."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        },
        {
          "id": "mustHave:0",
          "ref": {
            "field": "mustHave",
            "index": 0
          },
          "text": "Clear written communication",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 1698,
              "end": 1792,
              "quote": "Clear written communication and an ability to make information useful for different audiences."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        },
        {
          "id": "mustHave:1",
          "ref": {
            "field": "mustHave",
            "index": 1
          },
          "text": "Experience gathering or synthesising customer feedback",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 1795,
              "end": 1850,
              "quote": "Experience gathering or synthesising customer feedback."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        },
        {
          "id": "mustHave:2",
          "ref": {
            "field": "mustHave",
            "index": 2
          },
          "text": "Confidence with shared planning and documentation tools",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 1853,
              "end": 1950,
              "quote": "Confidence working with shared planning and documentation tools, such as Jira, Notion or similar."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        },
        {
          "id": "mustHave:3",
          "ref": {
            "field": "mustHave",
            "index": 3
          },
          "text": "Professional working proficiency in English",
          "anchorState": "verified",
          "adEvidence": [
            {
              "start": 1953,
              "end": 1997,
              "quote": "Professional working proficiency in English."
            }
          ],
          "requirement": "unspecified",
          "requirementEvidence": []
        }
      ]
    },
    "inputRef": {
      "cvVersionId": "drafted-sample-cv-v1",
      "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
    }
  },
  "data": {
    "ok": true,
    "blocksSchemaVersion": "1.0",
    "cvVersionId": "drafted-sample-cv-v1",
    "cvTitle": "Alex Morgan",
    "summaryOfChanges": "Review the integrated wording before accepting.",
    "blocks": [
      {
        "blockId": "sample-name",
        "type": "otherSections",
        "label": "Name",
        "order": 0,
        "text": "Alex Morgan"
      },
      {
        "blockId": "sample-contact",
        "type": "otherSections",
        "label": "Contact",
        "order": 1,
        "text": "Stockholm, Sweden · alex.morgan@example.com"
      },
      {
        "blockId": "sample-profile",
        "type": "summary",
        "label": "Profile",
        "order": 10,
        "text": "Product operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers."
      },
      {
        "blockId": "sample-product",
        "type": "experience",
        "label": "Experience",
        "order": 20,
        "title": "Product Operations Specialist",
        "employer": "Northline Digital (fictional)",
        "startDate": "2022",
        "endDate": "Present",
        "text": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions."
      },
      {
        "blockId": "sample-support",
        "type": "experience",
        "label": "Experience",
        "order": 30,
        "title": "Customer Support Coordinator",
        "employer": "Harbor Services (fictional)",
        "startDate": "2019",
        "endDate": "2022",
        "text": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly."
      },
      {
        "blockId": "sample-education",
        "type": "education",
        "label": "Education",
        "order": 40,
        "degree": "BSc",
        "program": "Information Systems",
        "institution": "Example University (fictional)",
        "startDate": "2016",
        "endDate": "2019",
        "text": "Coursework in service design, databases and project coordination."
      },
      {
        "blockId": "sample-skills",
        "type": "skills",
        "label": "Skills",
        "order": 50,
        "text": "Customer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish"
      }
    ],
    "rewrittenCv": "Alex Morgan\n\nStockholm, Sweden · alex.morgan@example.com\n\nProduct operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.\n\n• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.\n\n• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.\n\nCoursework in service design, databases and project coordination.\n\nCustomer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
    "rewrittenCvLegacy": "Alex Morgan\n\nStockholm, Sweden · alex.morgan@example.com\n\nProduct operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.\n\n• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.\n\n• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.\n\nCoursework in service design, databases and project coordination.\n\nCustomer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
    "sourcesSchemaVersion": "1.3",
    "sourceContextRevision": "sample-context-2:8:complete:2",
    "sourceRoundId": "sample-source-3",
    "sourceUsage": [
      {
        "applicationId": "sha256:5f421148c26aa54316bcb378140e4a2ac84958026dc5edc49a74249461bafdae",
        "blockId": "sample-product",
        "answerId": "sample-source-4",
        "answerRevision": 2,
        "sourceQuote": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap.",
        "experienceContext": {
          "kind": "cv_entry",
          "cvVersionId": "drafted-sample-cv-v1",
          "blockId": "sample-product",
          "snapshot": {
            "type": "experience",
            "label": "Experience",
            "companyOrContext": "Northline Digital (fictional)",
            "roleOrProject": "Product Operations Specialist",
            "startDate": "2022",
            "endDate": "Present"
          }
        },
        "proposedQuote": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.",
        "contextQuote": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap."
      },
      {
        "applicationId": "sha256:0ea0148927c4a0ae3639ec0f141dba9fa6bda9db3e2754db3f7a7aad4c8d7056",
        "blockId": "sample-support",
        "answerId": "sample-source-5",
        "answerRevision": 2,
        "sourceQuote": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly.",
        "experienceContext": {
          "kind": "cv_entry",
          "cvVersionId": "drafted-sample-cv-v1",
          "blockId": "sample-support",
          "snapshot": {
            "type": "experience",
            "label": "Experience",
            "companyOrContext": "Harbor Services (fictional)",
            "roleOrProject": "Customer Support Coordinator",
            "startDate": "2019",
            "endDate": "2022"
          }
        },
        "proposedQuote": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.",
        "contextQuote": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly."
      }
    ],
    "sourceApplications": [],
    "sourceReview": [],
    "contextQuestions": [],
    "cvEdits": [],
    "scope": "prepared-sample-v2",
    "recipe": {
      "integrations": [
        {
          "targetKey": "t2_prepared-sample-v2",
          "segments": [
            {
              "text": "Product operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.",
              "cvEvidenceKeys": [
                "cv2_0_prepared-sample-v2"
              ],
              "answerSourceKeys": []
            }
          ]
        },
        {
          "targetKey": "t3_prepared-sample-v2",
          "segments": [
            {
              "text": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.",
              "cvEvidenceKeys": [
                "cv3_0_prepared-sample-v2",
                "cv3_1_prepared-sample-v2",
                "cv3_2_prepared-sample-v2"
              ],
              "answerSourceKeys": [
                "a0_prepared-sample-v2"
              ]
            }
          ]
        },
        {
          "targetKey": "t4_prepared-sample-v2",
          "segments": [
            {
              "text": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.",
              "cvEvidenceKeys": [
                "cv4_0_prepared-sample-v2",
                "cv4_1_prepared-sample-v2",
                "cv4_2_prepared-sample-v2"
              ],
              "answerSourceKeys": [
                "a1_prepared-sample-v2"
              ]
            }
          ]
        },
        {
          "targetKey": "t6_prepared-sample-v2",
          "segments": [
            {
              "text": "Customer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
              "cvEvidenceKeys": [
                "cv6_0_prepared-sample-v2"
              ],
              "answerSourceKeys": []
            }
          ]
        }
      ],
      "contextQuestions": [],
      "reviewNotes": []
    },
    "inputRef": {
      "cvVersionId": "drafted-sample-cv-v1",
      "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
    },
    "integrations": [
      {
        "id": "sha256:f0d8c06a9a98d9b2d403c4997b215fb48864038adfacb6eeeacf31186bafc44f",
        "blockId": "sample-profile",
        "before": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements.",
        "after": "Product operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.",
        "segments": [
          {
            "start": 0,
            "end": 152,
            "text": "Product operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.",
            "cvEvidence": [
              {
                "blockId": "sample-profile",
                "quote": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
              }
            ],
            "answerSources": []
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-profile",
            "quote": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:097f8a8e1dd15a381517447152fe956336dc680bc9d263e41d402f58be533e68",
        "afterHash": "sha256:f9c0782923071a211c343a553dbbdc72af0dffe9738a68fc6bea9a21d7ee1eb9"
      },
      {
        "id": "sha256:5f421148c26aa54316bcb378140e4a2ac84958026dc5edc49a74249461bafdae",
        "blockId": "sample-product",
        "before": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on.",
        "after": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.",
        "segments": [
          {
            "start": 0,
            "end": 385,
            "text": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.",
            "cvEvidence": [
              {
                "blockId": "sample-product",
                "quote": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support."
              },
              {
                "blockId": "sample-product",
                "quote": "• Interviewed eight customers about account setup and worked with the designer on a clearer checklist."
              },
              {
                "blockId": "sample-product",
                "quote": "• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
              }
            ],
            "answerSources": [
              {
                "answerId": "sample-source-4",
                "answerRevision": 2,
                "sourceQuote": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap.",
                "experienceContext": {
                  "kind": "cv_entry",
                  "cvVersionId": "drafted-sample-cv-v1",
                  "blockId": "sample-product",
                  "snapshot": {
                    "type": "experience",
                    "label": "Experience",
                    "companyOrContext": "Northline Digital (fictional)",
                    "roleOrProject": "Product Operations Specialist",
                    "startDate": "2022",
                    "endDate": "Present"
                  }
                }
              }
            ]
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-product",
            "quote": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support."
          },
          {
            "blockId": "sample-product",
            "quote": "• Interviewed eight customers about account setup and worked with the designer on a clearer checklist."
          },
          {
            "blockId": "sample-product",
            "quote": "• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:60c611db13d2caed3a6605de19a71ce9ed0dbd7840077d778f9dbd2c9f9b4b54",
        "afterHash": "sha256:734650db97d7b8d6b9431900123bddd8cb921b1dc940033ec3626a591db18efb"
      },
      {
        "id": "sha256:0ea0148927c4a0ae3639ec0f141dba9fa6bda9db3e2754db3f7a7aad4c8d7056",
        "blockId": "sample-support",
        "before": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings.",
        "after": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.",
        "segments": [
          {
            "start": 0,
            "end": 285,
            "text": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.",
            "cvEvidence": [
              {
                "blockId": "sample-support",
                "quote": "• Answered customer questions about bookings and helped new colleagues learn the support process."
              },
              {
                "blockId": "sample-support",
                "quote": "• Wrote twelve help articles based on recurring questions, with review from the support lead."
              },
              {
                "blockId": "sample-support",
                "quote": "• Shared recurring booking problems with the product team during monthly feedback meetings."
              }
            ],
            "answerSources": [
              {
                "answerId": "sample-source-5",
                "answerRevision": 2,
                "sourceQuote": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly.",
                "experienceContext": {
                  "kind": "cv_entry",
                  "cvVersionId": "drafted-sample-cv-v1",
                  "blockId": "sample-support",
                  "snapshot": {
                    "type": "experience",
                    "label": "Experience",
                    "companyOrContext": "Harbor Services (fictional)",
                    "roleOrProject": "Customer Support Coordinator",
                    "startDate": "2019",
                    "endDate": "2022"
                  }
                }
              }
            ]
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-support",
            "quote": "• Answered customer questions about bookings and helped new colleagues learn the support process."
          },
          {
            "blockId": "sample-support",
            "quote": "• Wrote twelve help articles based on recurring questions, with review from the support lead."
          },
          {
            "blockId": "sample-support",
            "quote": "• Shared recurring booking problems with the product team during monthly feedback meetings."
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:b1e6d47cb14610f76ae1c9d26dcee105b33d337e593f4c1dfa6052a46cddda23",
        "afterHash": "sha256:d73f2957b45561a9f90fe7dd4115790dd041ef5634358c7b95bf3249ed77c1ec"
      },
      {
        "id": "sha256:4405dc045211cc70fecc7b33b4340bcb402589b987cc4828494610c6339689fe",
        "blockId": "sample-skills",
        "before": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish",
        "after": "Customer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
        "segments": [
          {
            "start": 0,
            "end": 90,
            "text": "Customer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
            "cvEvidence": [
              {
                "blockId": "sample-skills",
                "quote": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
              }
            ],
            "answerSources": []
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-skills",
            "quote": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:18228fb0f136aa077785544f11a6ba83f2e8466702069474a6ab5a1ec04c77ed",
        "afterHash": "sha256:593e2b0a5ee802203da7ba890e2fe8a31f82c757f126d1c867732f3021071ba1"
      }
    ],
    "integrationApplications": [
      {
        "id": "sha256:f0d8c06a9a98d9b2d403c4997b215fb48864038adfacb6eeeacf31186bafc44f",
        "blockId": "sample-profile",
        "before": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements.",
        "after": "Product operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.",
        "segments": [
          {
            "start": 0,
            "end": 152,
            "text": "Product operations specialist coordinating releases and translating customer feedback into practical service improvements with designers and developers.",
            "cvEvidence": [
              {
                "blockId": "sample-profile",
                "quote": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
              }
            ],
            "answerSources": []
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-profile",
            "quote": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:097f8a8e1dd15a381517447152fe956336dc680bc9d263e41d402f58be533e68",
        "afterHash": "sha256:f9c0782923071a211c343a553dbbdc72af0dffe9738a68fc6bea9a21d7ee1eb9"
      },
      {
        "id": "sha256:5f421148c26aa54316bcb378140e4a2ac84958026dc5edc49a74249461bafdae",
        "blockId": "sample-product",
        "before": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on.",
        "after": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.",
        "segments": [
          {
            "start": 0,
            "end": 385,
            "text": "• Coordinated monthly release planning with a designer and four developers, maintaining the delivery board and progress updates to support.\n• Interviewed eight customers about account setup and collaborated with the designer on a clearer checklist.\n• Introduced a shared checklist for weekly support-feedback discussions; the product lead retained prioritisation and roadmap decisions.",
            "cvEvidence": [
              {
                "blockId": "sample-product",
                "quote": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support."
              },
              {
                "blockId": "sample-product",
                "quote": "• Interviewed eight customers about account setup and worked with the designer on a clearer checklist."
              },
              {
                "blockId": "sample-product",
                "quote": "• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
              }
            ],
            "answerSources": [
              {
                "answerId": "sample-source-4",
                "answerRevision": 2,
                "sourceQuote": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap.",
                "experienceContext": {
                  "kind": "cv_entry",
                  "cvVersionId": "drafted-sample-cv-v1",
                  "blockId": "sample-product",
                  "snapshot": {
                    "type": "experience",
                    "label": "Experience",
                    "companyOrContext": "Northline Digital (fictional)",
                    "roleOrProject": "Product Operations Specialist",
                    "startDate": "2022",
                    "endDate": "Present"
                  }
                }
              }
            ]
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-product",
            "quote": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support."
          },
          {
            "blockId": "sample-product",
            "quote": "• Interviewed eight customers about account setup and worked with the designer on a clearer checklist."
          },
          {
            "blockId": "sample-product",
            "quote": "• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:60c611db13d2caed3a6605de19a71ce9ed0dbd7840077d778f9dbd2c9f9b4b54",
        "afterHash": "sha256:734650db97d7b8d6b9431900123bddd8cb921b1dc940033ec3626a591db18efb"
      },
      {
        "id": "sha256:0ea0148927c4a0ae3639ec0f141dba9fa6bda9db3e2754db3f7a7aad4c8d7056",
        "blockId": "sample-support",
        "before": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings.",
        "after": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.",
        "segments": [
          {
            "start": 0,
            "end": 285,
            "text": "• Answered booking questions and onboarded new support colleagues.\n• Wrote twelve help articles based on recurring questions, reviewed by the support lead before publication.\n• Used the articles in colleague onboarding and shared recurring booking issues with the product team monthly.",
            "cvEvidence": [
              {
                "blockId": "sample-support",
                "quote": "• Answered customer questions about bookings and helped new colleagues learn the support process."
              },
              {
                "blockId": "sample-support",
                "quote": "• Wrote twelve help articles based on recurring questions, with review from the support lead."
              },
              {
                "blockId": "sample-support",
                "quote": "• Shared recurring booking problems with the product team during monthly feedback meetings."
              }
            ],
            "answerSources": [
              {
                "answerId": "sample-source-5",
                "answerRevision": 2,
                "sourceQuote": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly.",
                "experienceContext": {
                  "kind": "cv_entry",
                  "cvVersionId": "drafted-sample-cv-v1",
                  "blockId": "sample-support",
                  "snapshot": {
                    "type": "experience",
                    "label": "Experience",
                    "companyOrContext": "Harbor Services (fictional)",
                    "roleOrProject": "Customer Support Coordinator",
                    "startDate": "2019",
                    "endDate": "2022"
                  }
                }
              }
            ]
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-support",
            "quote": "• Answered customer questions about bookings and helped new colleagues learn the support process."
          },
          {
            "blockId": "sample-support",
            "quote": "• Wrote twelve help articles based on recurring questions, with review from the support lead."
          },
          {
            "blockId": "sample-support",
            "quote": "• Shared recurring booking problems with the product team during monthly feedback meetings."
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:b1e6d47cb14610f76ae1c9d26dcee105b33d337e593f4c1dfa6052a46cddda23",
        "afterHash": "sha256:d73f2957b45561a9f90fe7dd4115790dd041ef5634358c7b95bf3249ed77c1ec"
      },
      {
        "id": "sha256:4405dc045211cc70fecc7b33b4340bcb402589b987cc4828494610c6339689fe",
        "blockId": "sample-skills",
        "before": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish",
        "after": "Customer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
        "segments": [
          {
            "start": 0,
            "end": 90,
            "text": "Customer interviews · Feedback synthesis · Release coordination · Jira · English · Swedish",
            "cvEvidence": [
              {
                "blockId": "sample-skills",
                "quote": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
              }
            ],
            "answerSources": []
          }
        ],
        "originalEvidence": [
          {
            "blockId": "sample-skills",
            "quote": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
          }
        ],
        "supersedes": [],
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "requestHash": "sha256:e28a5917de87f98d1de95d94ed1928d676f74d9caae8cf6c153e6824e861d17c"
        },
        "beforeHash": "sha256:18228fb0f136aa077785544f11a6ba83f2e8466702069474a6ab5a1ec04c77ed",
        "afterHash": "sha256:593e2b0a5ee802203da7ba890e2fe8a31f82c757f126d1c867732f3021071ba1"
      }
    ]
  },
  "discovery": {
    "session": {
      "modelVersion": "source-answers-2",
      "revision": 8,
      "context": {
        "revision": "sample-context-2",
        "cvVersionId": "drafted-sample-cv-v1",
        "blocks": [
          {
            "blockId": "sample-name",
            "type": "otherSections",
            "label": "Name",
            "order": 0,
            "text": "Alex Morgan"
          },
          {
            "blockId": "sample-contact",
            "type": "otherSections",
            "label": "Contact",
            "order": 1,
            "text": "Stockholm, Sweden · alex.morgan@example.com"
          },
          {
            "blockId": "sample-profile",
            "type": "summary",
            "label": "Profile",
            "order": 10,
            "text": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
          },
          {
            "blockId": "sample-product",
            "type": "experience",
            "label": "Experience",
            "order": 20,
            "title": "Product Operations Specialist",
            "employer": "Northline Digital (fictional)",
            "startDate": "2022",
            "endDate": "Present",
            "text": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
          },
          {
            "blockId": "sample-support",
            "type": "experience",
            "label": "Experience",
            "order": 30,
            "title": "Customer Support Coordinator",
            "employer": "Harbor Services (fictional)",
            "startDate": "2019",
            "endDate": "2022",
            "text": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings."
          },
          {
            "blockId": "sample-education",
            "type": "education",
            "label": "Education",
            "order": 40,
            "degree": "BSc",
            "program": "Information Systems",
            "institution": "Example University (fictional)",
            "startDate": "2016",
            "endDate": "2019",
            "text": "Coursework in service design, databases and project coordination."
          },
          {
            "blockId": "sample-skills",
            "type": "skills",
            "label": "Skills",
            "order": 50,
            "text": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
          }
        ],
        "jobContext": {
          "roleTitle": "Product Operations Specialist",
          "seniority": "mid",
          "surfaces": [
            "web"
          ],
          "tone": "balanced",
          "topPriorities": [
            {
              "signal": "Coordinate release planning",
              "weight": 5
            },
            {
              "signal": "Bring customer feedback into prioritisation",
              "weight": 5
            },
            {
              "signal": "Collaborate with design, development and support",
              "weight": 4
            }
          ],
          "mustHave": [],
          "successMetrics": [],
          "keywords": [
            "release planning",
            "customer interviews",
            "documentation",
            "collaboration",
            "feedback",
            "support",
            "delivery",
            "prioritisation",
            "product operations",
            "Jira"
          ]
        }
      },
      "round": {
        "id": "sample-source-3",
        "contextRevision": "sample-context-2",
        "language": "en",
        "phase": "complete",
        "total": 2,
        "index": 2,
        "queue": [
          {
            "id": "sample-source-1",
            "topicKey": "delivery",
            "signalRefs": [
              {
                "field": "topPriorities",
                "index": 0
              }
            ],
            "question": "What did you personally coordinate in a release, and how did the team use customer feedback?",
            "status": "recorded",
            "followupUsed": false,
            "answerId": "sample-source-4"
          },
          {
            "id": "sample-source-2",
            "topicKey": "knowledge",
            "signalRefs": [
              {
                "field": "topPriorities",
                "index": 1
              }
            ],
            "question": "How did you make recurring customer questions easier for colleagues to handle?",
            "status": "recorded",
            "followupUsed": false,
            "answerId": "sample-source-5"
          }
        ],
        "reserve": [],
        "batchStart": 0,
        "notice": ""
      },
      "answers": [
        {
          "id": "sample-source-4",
          "questionId": "sample-source-1",
          "topicKey": "delivery",
          "roundId": "sample-source-3",
          "context": {
            "revision": "sample-context-2",
            "cvVersionId": "drafted-sample-cv-v1",
            "blocks": [
              {
                "blockId": "sample-name",
                "type": "otherSections",
                "label": "Name",
                "order": 0,
                "text": "Alex Morgan"
              },
              {
                "blockId": "sample-contact",
                "type": "otherSections",
                "label": "Contact",
                "order": 1,
                "text": "Stockholm, Sweden · alex.morgan@example.com"
              },
              {
                "blockId": "sample-profile",
                "type": "summary",
                "label": "Profile",
                "order": 10,
                "text": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
              },
              {
                "blockId": "sample-product",
                "type": "experience",
                "label": "Experience",
                "order": 20,
                "title": "Product Operations Specialist",
                "employer": "Northline Digital (fictional)",
                "startDate": "2022",
                "endDate": "Present",
                "text": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
              },
              {
                "blockId": "sample-support",
                "type": "experience",
                "label": "Experience",
                "order": 30,
                "title": "Customer Support Coordinator",
                "employer": "Harbor Services (fictional)",
                "startDate": "2019",
                "endDate": "2022",
                "text": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings."
              },
              {
                "blockId": "sample-education",
                "type": "education",
                "label": "Education",
                "order": 40,
                "degree": "BSc",
                "program": "Information Systems",
                "institution": "Example University (fictional)",
                "startDate": "2016",
                "endDate": "2019",
                "text": "Coursework in service design, databases and project coordination."
              },
              {
                "blockId": "sample-skills",
                "type": "skills",
                "label": "Skills",
                "order": 50,
                "text": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
              }
            ],
            "jobContext": {
              "roleTitle": "Product Operations Specialist",
              "seniority": "mid",
              "surfaces": [
                "web"
              ],
              "tone": "balanced",
              "topPriorities": [
                {
                  "signal": "Coordinate release planning",
                  "weight": 5
                },
                {
                  "signal": "Bring customer feedback into prioritisation",
                  "weight": 5
                },
                {
                  "signal": "Collaborate with design, development and support",
                  "weight": 4
                }
              ],
              "mustHave": [],
              "successMetrics": [],
              "keywords": [
                "release planning",
                "customer interviews",
                "documentation",
                "collaboration",
                "feedback",
                "support",
                "delivery",
                "prioritisation",
                "product operations",
                "Jira"
              ]
            }
          },
          "revisions": [
            {
              "revision": 1,
              "text": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap.",
              "experienceContext": {
                "kind": "cv_entry",
                "cvVersionId": "drafted-sample-cv-v1",
                "blockId": "sample-product",
                "snapshot": {
                  "type": "experience",
                  "label": "Experience",
                  "companyOrContext": "Northline Digital (fictional)",
                  "roleOrProject": "Product Operations Specialist",
                  "startDate": "2022",
                  "endDate": "Present"
                }
              },
              "experienceContextOrigin": "answer"
            },
            {
              "revision": 2,
              "text": "At Northline Digital (fictional), I coordinated the monthly release meeting with a designer and four developers. I maintained the delivery board and sent progress updates to support. I also introduced a shared checklist for the weekly support-feedback discussion so that recurring issues were reviewed consistently. The product lead decided priorities; I did not own the roadmap.",
              "experienceContext": {
                "kind": "cv_entry",
                "cvVersionId": "drafted-sample-cv-v1",
                "blockId": "sample-product",
                "snapshot": {
                  "type": "experience",
                  "label": "Experience",
                  "companyOrContext": "Northline Digital (fictional)",
                  "roleOrProject": "Product Operations Specialist",
                  "startDate": "2022",
                  "endDate": "Present"
                }
              }
            }
          ],
          "currentRevision": 2,
          "drafts": [],
          "status": "recorded"
        },
        {
          "id": "sample-source-5",
          "questionId": "sample-source-2",
          "topicKey": "knowledge",
          "roundId": "sample-source-3",
          "context": {
            "revision": "sample-context-2",
            "cvVersionId": "drafted-sample-cv-v1",
            "blocks": [
              {
                "blockId": "sample-name",
                "type": "otherSections",
                "label": "Name",
                "order": 0,
                "text": "Alex Morgan"
              },
              {
                "blockId": "sample-contact",
                "type": "otherSections",
                "label": "Contact",
                "order": 1,
                "text": "Stockholm, Sweden · alex.morgan@example.com"
              },
              {
                "blockId": "sample-profile",
                "type": "summary",
                "label": "Profile",
                "order": 10,
                "text": "I work in product operations and help teams make digital services easier to use. I have experience planning releases, keeping track of feedback and making sure people know what happens next. I enjoy working with designers and developers to turn user needs into practical improvements."
              },
              {
                "blockId": "sample-product",
                "type": "experience",
                "label": "Experience",
                "order": 20,
                "title": "Product Operations Specialist",
                "employer": "Northline Digital (fictional)",
                "startDate": "2022",
                "endDate": "Present",
                "text": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support.\n• Interviewed eight customers about account setup and worked with the designer on a clearer checklist.\n• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
              },
              {
                "blockId": "sample-support",
                "type": "experience",
                "label": "Experience",
                "order": 30,
                "title": "Customer Support Coordinator",
                "employer": "Harbor Services (fictional)",
                "startDate": "2019",
                "endDate": "2022",
                "text": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings."
              },
              {
                "blockId": "sample-education",
                "type": "education",
                "label": "Education",
                "order": 40,
                "degree": "BSc",
                "program": "Information Systems",
                "institution": "Example University (fictional)",
                "startDate": "2016",
                "endDate": "2019",
                "text": "Coursework in service design, databases and project coordination."
              },
              {
                "blockId": "sample-skills",
                "type": "skills",
                "label": "Skills",
                "order": 50,
                "text": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
              }
            ],
            "jobContext": {
              "roleTitle": "Product Operations Specialist",
              "seniority": "mid",
              "surfaces": [
                "web"
              ],
              "tone": "balanced",
              "topPriorities": [
                {
                  "signal": "Coordinate release planning",
                  "weight": 5
                },
                {
                  "signal": "Bring customer feedback into prioritisation",
                  "weight": 5
                },
                {
                  "signal": "Collaborate with design, development and support",
                  "weight": 4
                }
              ],
              "mustHave": [],
              "successMetrics": [],
              "keywords": [
                "release planning",
                "customer interviews",
                "documentation",
                "collaboration",
                "feedback",
                "support",
                "delivery",
                "prioritisation",
                "product operations",
                "Jira"
              ]
            }
          },
          "revisions": [
            {
              "revision": 1,
              "text": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly.",
              "experienceContext": {
                "kind": "cv_entry",
                "cvVersionId": "drafted-sample-cv-v1",
                "blockId": "sample-support",
                "snapshot": {
                  "type": "experience",
                  "label": "Experience",
                  "companyOrContext": "Harbor Services (fictional)",
                  "roleOrProject": "Customer Support Coordinator",
                  "startDate": "2019",
                  "endDate": "2022"
                }
              },
              "experienceContextOrigin": "answer"
            },
            {
              "revision": 2,
              "text": "At Harbor Services (fictional), I wrote twelve help articles after noticing repeated booking questions. The support lead reviewed them before publication. I used the articles when helping new colleagues learn the support process and shared recurring booking problems with the product team monthly.",
              "experienceContext": {
                "kind": "cv_entry",
                "cvVersionId": "drafted-sample-cv-v1",
                "blockId": "sample-support",
                "snapshot": {
                  "type": "experience",
                  "label": "Experience",
                  "companyOrContext": "Harbor Services (fictional)",
                  "roleOrProject": "Customer Support Coordinator",
                  "startDate": "2019",
                  "endDate": "2022"
                }
              }
            }
          ],
          "currentRevision": 2,
          "drafts": [],
          "status": "recorded"
        }
      ]
    },
    "fingerprint": "",
    "opened": false,
    "planState": "ready",
    "savedScroll": 0,
    "archived": [],
    "drafts": []
  },
  "coverage": {
    "session": {
      "schemaVersion": "1.0",
      "status": "ready",
      "catalog": {
        "jobRef": {
          "jobRevisionId": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
          "jobTextHash": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
          "jobContextHash": "sha256:6df586392e09efc76fb2afa5733118c4cbbf15db58c992983f4ba64290e9a938"
        },
        "revision": "sha256:c95baefc8ccdaea8ef506621460358d93523f8a83f43449aae4fb4b468dc5236",
        "signals": [
          {
            "id": "topPriorities:0",
            "ref": {
              "field": "topPriorities",
              "index": 0
            },
            "text": "Coordinate release planning",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 999,
                "end": 1088,
                "quote": "Coordinate release planning, maintain delivery information and follow up on dependencies."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "topPriorities:1",
            "ref": {
              "field": "topPriorities",
              "index": 1
            },
            "text": "Bring customer feedback into prioritisation",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1256,
                "end": 1334,
                "quote": "Organise feedback so recurring problems can inform prioritisation discussions."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "topPriorities:2",
            "ref": {
              "field": "topPriorities",
              "index": 2
            },
            "text": "Collaborate with design, development and support",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 518,
                "end": 637,
                "quote": "You’ll work alongside our Product Lead, designers and developers to keep product delivery organised and teams informed."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:0",
            "ref": {
              "field": "mustHave",
              "index": 0
            },
            "text": "Clear written communication",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1698,
                "end": 1792,
                "quote": "Clear written communication and an ability to make information useful for different audiences."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:1",
            "ref": {
              "field": "mustHave",
              "index": 1
            },
            "text": "Experience gathering or synthesising customer feedback",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1795,
                "end": 1850,
                "quote": "Experience gathering or synthesising customer feedback."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:2",
            "ref": {
              "field": "mustHave",
              "index": 2
            },
            "text": "Confidence with shared planning and documentation tools",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1853,
                "end": 1950,
                "quote": "Confidence working with shared planning and documentation tools, such as Jira, Notion or similar."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:3",
            "ref": {
              "field": "mustHave",
              "index": 3
            },
            "text": "Professional working proficiency in English",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1953,
                "end": 1997,
                "quote": "Professional working proficiency in English."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          }
        ]
      },
      "resultCatalog": {
        "jobRef": {
          "jobRevisionId": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
          "jobTextHash": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
          "jobContextHash": "sha256:6df586392e09efc76fb2afa5733118c4cbbf15db58c992983f4ba64290e9a938"
        },
        "revision": "sha256:c95baefc8ccdaea8ef506621460358d93523f8a83f43449aae4fb4b468dc5236",
        "signals": [
          {
            "id": "topPriorities:0",
            "ref": {
              "field": "topPriorities",
              "index": 0
            },
            "text": "Coordinate release planning",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 999,
                "end": 1088,
                "quote": "Coordinate release planning, maintain delivery information and follow up on dependencies."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "topPriorities:1",
            "ref": {
              "field": "topPriorities",
              "index": 1
            },
            "text": "Bring customer feedback into prioritisation",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1256,
                "end": 1334,
                "quote": "Organise feedback so recurring problems can inform prioritisation discussions."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "topPriorities:2",
            "ref": {
              "field": "topPriorities",
              "index": 2
            },
            "text": "Collaborate with design, development and support",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 518,
                "end": 637,
                "quote": "You’ll work alongside our Product Lead, designers and developers to keep product delivery organised and teams informed."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:0",
            "ref": {
              "field": "mustHave",
              "index": 0
            },
            "text": "Clear written communication",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1698,
                "end": 1792,
                "quote": "Clear written communication and an ability to make information useful for different audiences."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:1",
            "ref": {
              "field": "mustHave",
              "index": 1
            },
            "text": "Experience gathering or synthesising customer feedback",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1795,
                "end": 1850,
                "quote": "Experience gathering or synthesising customer feedback."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:2",
            "ref": {
              "field": "mustHave",
              "index": 2
            },
            "text": "Confidence with shared planning and documentation tools",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1853,
                "end": 1950,
                "quote": "Confidence working with shared planning and documentation tools, such as Jira, Notion or similar."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          },
          {
            "id": "mustHave:3",
            "ref": {
              "field": "mustHave",
              "index": 3
            },
            "text": "Professional working proficiency in English",
            "anchorState": "verified",
            "adEvidence": [
              {
                "start": 1953,
                "end": 1997,
                "quote": "Professional working proficiency in English."
              }
            ],
            "requirement": "unspecified",
            "requirementEvidence": []
          }
        ]
      },
      "result": {
        "assessmentId": "prepared-demo-original-v3",
        "inputRef": {
          "cvVersionId": "drafted-sample-cv-v1",
          "cvBlocksHash": "sha256:92896e3423ae12cc688a8bf6c166179493e2e3a045f0f08a64d582ee378f45e8",
          "jobRevisionId": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
          "jobTextHash": "sha256:8db212bba02c91d9590f71837f738b80f83bc95a7c009f7d829cf3113ccad18b",
          "jobContextHash": "sha256:6df586392e09efc76fb2afa5733118c4cbbf15db58c992983f4ba64290e9a938",
          "signalCatalogRevision": "sha256:c95baefc8ccdaea8ef506621460358d93523f8a83f43449aae4fb4b468dc5236",
          "policyVersion": "cv-coverage-1"
        },
        "rows": [
          {
            "signalId": "topPriorities:0",
            "status": "clear",
            "evidence": [
              {
                "blockId": "sample-product",
                "quote": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support."
              }
            ],
            "explanation": "The original CV explicitly describes monthly release planning, maintaining delivery information and communicating progress to support.",
            "question": ""
          },
          {
            "signalId": "topPriorities:1",
            "status": "partial",
            "evidence": [
              {
                "blockId": "sample-product",
                "quote": "• Collected support feedback each week and made sure the team discussed recurring issues before deciding what to work on."
              }
            ],
            "explanation": "The original CV describes collecting support feedback and discussing recurring issues. How that feedback was organised and followed through remains implicit.",
            "question": ""
          },
          {
            "signalId": "topPriorities:2",
            "status": "clear",
            "evidence": [
              {
                "blockId": "sample-product",
                "quote": "• Coordinated monthly release planning with a designer and four developers, maintained the delivery board and shared progress with customer support."
              }
            ],
            "explanation": "The original CV describes coordination with a designer, developers and customer support.",
            "question": ""
          },
          {
            "signalId": "mustHave:0",
            "status": "partial",
            "evidence": [
              {
                "blockId": "sample-support",
                "quote": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings."
              }
            ],
            "explanation": "The CV names twelve help articles reviewed by the support lead; the quality of writing is not independently assessed.",
            "question": ""
          },
          {
            "signalId": "mustHave:1",
            "status": "clear",
            "evidence": [
              {
                "blockId": "sample-support",
                "quote": "• Answered customer questions about bookings and helped new colleagues learn the support process.\n• Wrote twelve help articles based on recurring questions, with review from the support lead.\n• Shared recurring booking problems with the product team during monthly feedback meetings."
              }
            ],
            "explanation": "The CV describes collecting customer problems and sharing them with the product team.",
            "question": ""
          },
          {
            "signalId": "mustHave:2",
            "status": "partial",
            "evidence": [
              {
                "blockId": "sample-skills",
                "quote": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
              }
            ],
            "explanation": "Jira is listed, but its use for shared planning is not described.",
            "question": ""
          },
          {
            "signalId": "mustHave:3",
            "status": "partial",
            "evidence": [
              {
                "blockId": "sample-skills",
                "quote": "Release coordination · Customer interviews · Feedback synthesis · Jira · English · Swedish"
              }
            ],
            "explanation": "English is listed without a proficiency level.",
            "question": ""
          }
        ],
        "provenance": {
          "advisory": true,
          "model": "prepared-fictional-editorial-assessment",
          "generatedAt": "2026-11-11T12:00:00.000Z"
        }
      }
    },
    "opened": false,
    "filter": "all",
    "openSignals": []
  }
};
