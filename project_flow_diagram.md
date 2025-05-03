# Resume Optimization System Flow Diagrams

## Overall System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (React)"]
        Upload[Resume Upload Component]
        Preview[Resume Preview Component]
        Editor[Resume Editor]
        ResumeScore[Resume Score Component]
        JobTarget[Job Target Component]
    end

    subgraph Backend["Backend (Flask)"]
        API[RESTful API]
        Parser[Resume Parser]
        Analyzer[Resume Analyzer]
        Optimizer[Content Optimizer]
        PDFGenerator[PDF Generator]
    end

    subgraph Database["Data Storage"]
        MongoDB[(MongoDB)]
    end

    subgraph AI["AI Service"]
        OpenAI[OpenAI API]
    end

    Upload -->|Upload File| API
    API -->|Parse Request| Parser
    Parser -->|Store Parse Results| MongoDB
    API -->|Get Resume| MongoDB
    MongoDB -->|Return Resume Data| API
    API -->|Return Resume Data| Editor
    API -->|Analysis Request| Analyzer
    Analyzer -->|Call AI| OpenAI
    OpenAI -->|Analysis Results| Analyzer
    Analyzer -->|Store Analysis| MongoDB
    Editor -->|Optimization Request| API
    API -->|Optimize Content| Optimizer
    Optimizer -->|Call AI| OpenAI
    OpenAI -->|Optimization Results| Optimizer
    Optimizer -->|Return Optimized Content| API
    API -->|Return Optimized Content| Editor
    Editor -->|Export PDF Request| API
    API -->|Generate PDF| PDFGenerator
    PDFGenerator -->|Return PDF| API
    API -->|Return PDF| Editor
    
    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
    style Database fill:#bfb,stroke:#333,stroke-width:2px
    style AI fill:#fbf,stroke:#333,stroke-width:2px
```

## User Interaction Flow

```mermaid
sequenceDiagram
    actor User as User
    participant FE as Frontend Application
    participant BE as Backend API
    participant DB as MongoDB
    participant AI as OpenAI API
    
    User->>FE: Upload resume file
    FE->>BE: POST /api/v1/resumes (upload file)
    BE->>BE: Store file
    BE->>DB: Save resume metadata
    BE-->>FE: Return resumeId
    
    FE->>BE: POST /api/v1/resumes/{resumeId}/parse
    BE->>BE: Parse resume
    BE->>DB: Save parsed content
    BE-->>FE: Return parse status
    
    FE->>BE: GET /api/v1/resumes/{resumeId}
    BE->>DB: Get resume data
    DB-->>BE: Return resume content
    BE-->>FE: Return resume data
    FE->>FE: Display resume content
    
    User->>FE: Edit resume
    FE->>BE: PUT /api/v1/resumes/{resumeId}
    BE->>DB: Update resume content
    BE-->>FE: Return update status
    
    FE->>BE: POST /api/v1/resumes/{resumeId}/analyze
    BE->>AI: Send resume content for analysis
    AI-->>BE: Return analysis results
    BE->>DB: Save analysis results
    BE-->>FE: Return analysis score and recommendations
    FE->>FE: Display resume score
    
    User->>FE: Set target job position
    FE->>FE: Save target job position
    
    User->>FE: Click optimize content
    FE->>BE: POST /api/v1/resumes/{resumeId}/optimize
    BE->>BE: Prepare optimization request
    BE->>AI: Send resume content + target job
    AI-->>BE: Return optimized content
    BE-->>FE: Return optimized content
    FE->>FE: Update UI display
    
    User->>FE: Export PDF
    FE->>BE: GET /api/v1/resumes/{resumeId}/generate-pdf
    BE->>BE: Call PDF generator
    BE-->>FE: Return PDF file
    FE->>User: Download PDF file
```

## Resume Parsing Flow

```mermaid
flowchart TB
    Start([Start]) --> Upload[Upload Resume File]
    Upload --> FileCheck{File Type?}
    FileCheck -->|PDF| ParsePDF[Parse PDF]
    FileCheck -->|DOCX| ParseDOCX[Parse DOCX]
    FileCheck -->|Other| Error[Return Error]
    
    ParsePDF --> ExtractText[Extract Text Content]
    ParseDOCX --> ExtractText
    
    ExtractText --> AIParser[AI Parser]
    AIParser --> Sections[Identify Resume Sections]
    
    Sections --> Personal[Personal Information]
    Sections --> Summary[Summary]
    Sections --> Experience[Work Experience]
    Sections --> Skills[Skills]
    Sections --> Education[Education]
    Sections --> Projects[Project Experience]
    
    Personal --> SaveParsed[Save Parse Results]
    Summary --> SaveParsed
    Experience --> SaveParsed
    Skills --> SaveParsed
    Education --> SaveParsed
    Projects --> SaveParsed
    
    SaveParsed --> End([End])
    Error --> End
```

## PDF Generation Flow

```mermaid
flowchart TB
    Start([Start]) --> Request[Receive PDF Generation Request]
    Request --> GetData[Get Resume Data]
    GetData --> Config[Apply PDF Configuration]
    
    Config --> Header[Generate Header/Title]
    Header --> Contact[Add Contact Information]
    Contact --> RenderSections[Process Each Section]
    
    RenderSections --> Section{Section Type?}
    Section -->|Text Type| RenderText[Render Text]
    Section -->|List Type| RenderList[Render List]
    Section -->|Table Type| RenderTable[Render Table]
    
    RenderText --> NextSection{More Sections?}
    RenderList --> NextSection
    RenderTable --> NextSection
    
    NextSection -->|Yes| Section
    NextSection -->|No| GeneratePDF[Generate PDF File]
    
    GeneratePDF --> SaveTemp[Save Temporary File]
    SaveTemp --> Return[Return PDF File]
    Return --> End([End])
```

## Resume Analysis and Optimization Flow

```mermaid
flowchart TB
    Start([Start]) --> Analyze[Analyze Resume Request]
    
    Analyze --> Content[Extract Resume Content]
    Content --> Score[Calculate Overall Score]
    
    Score --> TechScore[Technical Skills Score]
    Score --> ATSScore[ATS Compatibility Score]
    Score --> CommScore[Communication Skills Score]
    
    TechScore --> Feedback[Generate Improvement Suggestions]
    ATSScore --> Feedback
    CommScore --> Feedback
    
    Feedback --> Gap[Identify Skill Gaps]
    Gap --> Suggest[Provide Content Suggestions]
    
    Suggest --> Save[Save Analysis Results]
    Save --> End([End])
    
    OptReq[Optimization Request] --> GetJob[Get Target Job Position]
    GetJob --> LoadContent[Load Content to Optimize]
    LoadContent --> Context[Prepare Optimization Context]
    Context --> AIPrompt[Build AI Prompt]
    
    AIPrompt --> SendToAI[Send to OpenAI]
    SendToAI --> Process[Process AI Response]
    Process --> Enhance[Enhance Content]
    Enhance --> Return[Return Optimized Content]
    Return --> EndOpt([End Optimization])
```

## Frontend-Backend Interaction Diagram

```mermaid
flowchart LR
    subgraph Frontend
        direction TB
        UI[User Interface] --> Api[API Service]
        Api --> UI
        UI --> Components[Components]
        Components --> UI
        
        subgraph Components
            direction TB
            ResumeEditor[Resume Editor]
            ResumePreview[Resume Preview]
            StringFieldEditor[String Field Editor]
            ArrayFieldEditor[Array Field Editor]
            OptimizeButton[Optimize Button]
            SortableSection[Sortable Section]
        end
    end
    
    subgraph Backend
        direction TB
        Routes[API Routes] --> Controllers[Controllers]
        Controllers --> Services[Services]
        Services --> Routes
        
        subgraph Services
            direction TB
            ResumeService[Resume Service]
            ParserService[Parser Service]
            AIService[AI Service]
            PDFService[PDF Service]
        end
    end
    
    Frontend <--> Backend
    
    Backend <--> DB[(MongoDB)]
    Backend <--> AI[OpenAI API]
    
    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
```

## Data Model Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ RESUME : owns
    RESUME ||--|| RESUME_CONTENT : contains
    RESUME ||--o| ANALYSIS : has
    RESUME ||--o{ PDF : generates
    
    USER {
        string id PK
        string email
        string name
        date created_at
    }
    
    RESUME {
        string id PK
        string user_id FK
        string filename
        string status
        date uploaded_at
        date updated_at
    }
    
    RESUME_CONTENT {
        string resume_id FK
        object personal_information
        string summary
        array skills
        array experience
        array education
        array projects
        array section_order
    }
    
    ANALYSIS {
        string resume_id FK
        number overall_score
        number technical_score
        number ats_compatibility_score
        number communication_score
        array areas_for_improvement
        date analyzed_at
    }
    
    PDF {
        string id PK
        string resume_id FK
        string filename
        date generated_at
    }
```

## Deployment Architecture Diagram

```mermaid
flowchart TB
    subgraph Client[Client]
        Browser[Web Browser]
    end
    
    subgraph Cloud["Cloud Platform"]
        subgraph Container["Docker Containers"]
            Frontend[React Frontend]
            Backend[Flask Backend]
        end
        
        Database[(MongoDB Database)]
        
        Storage[File Storage]
    end
    
    subgraph ExternalServices["External Services"]
        OpenAI[OpenAI API]
    end
    
    Browser <--> Frontend
    Frontend <--> Backend
    Backend <--> Database
    Backend <--> Storage
    Backend <--> OpenAI
    
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style Cloud fill:#bbf,stroke:#333,stroke-width:2px
    style ExternalServices fill:#fbf,stroke:#333,stroke-width:2px
``` 