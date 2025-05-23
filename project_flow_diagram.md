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
        JobRecs[Job Recommendations]
        AIContent[AI Content Optimizer]
    end

    subgraph Backend["Backend (Flask)"]
        API[RESTful API]
        Parser[Resume Parser]
        Analyzer[Resume Analyzer]
        Optimizer[Content Optimizer]
        PDFGenerator[PDF Generator]
        JobMatcher[Job Matcher]
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
    
    JobTarget -->|Set Target Job| API
    API -->|Match Jobs| JobMatcher
    JobMatcher -->|Get Job Data| MongoDB
    JobMatcher -->|Return Matches| API
    API -->|Return Job Matches| JobRecs
    
    AIContent -->|Optimize Section| API
    API -->|Optimize Content| Optimizer
    
    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
    style Database fill:#bfb,stroke:#333,stroke-width:2px
    style AI fill:#fbf,stroke:#333,stroke-width:2px
```

## API Endpoints Documentation

### Resume Management APIs

```mermaid
flowchart LR
    subgraph ResumeManagement["Resume Management"]
        Upload[POST /api/v1/resumes/upload]
        List[GET /api/v1/resumes]
        Get[GET /api/v1/resumes/:id]
        Delete[DELETE /api/v1/resumes/:id]
    end
    
    subgraph ContentManagement["Content Management"]
        Parse[POST /api/v1/resumes/:id/parse]
        Update[PUT /api/v1/resumes/:id/content]
        Optimize[POST /api/v1/resumes/:id/optimize-content]
    end
    
    subgraph Analysis["Analysis & Optimization"]
        Analyze[POST /api/v1/resumes/:id/analyze]
        GetAnalysis[GET /api/v1/analyses/:id]
        Keywords[GET /api/v1/resumes/:id/extract-keywords]
    end
    
    subgraph Export["Export & Download"]
        GeneratePDF[GET /api/v1/resumes/:id/generate-pdf]
        Download[GET /api/v1/resumes/:id/download]
    end
    
    subgraph JobMatching["Job Matching"]
        JobSuggestions[GET /api/v1/resumes/:id/job-suggestions]
    end
    
    subgraph System["System"]
        Health[GET /api/v1/health]
    end
    
    style ResumeManagement fill:#f9f,stroke:#333,stroke-width:2px
    style ContentManagement fill:#bbf,stroke:#333,stroke-width:2px
    style Analysis fill:#bfb,stroke:#333,stroke-width:2px
    style Export fill:#fbf,stroke:#333,stroke-width:2px
    style JobMatching fill:#fdb,stroke:#333,stroke-width:2px
    style System fill:#ddd,stroke:#333,stroke-width:2px
```

### API Response Format

```mermaid
flowchart TD
    Response[API Response] --> Success[Success Response]
    Response --> Error[Error Response]
    
    Success --> SuccessData[Data Object]
    Success --> SuccessStatus[Status: success]
    
    Error --> ErrorMessage[Error Message]
    Error --> ErrorStatus[Status: error]
    
    subgraph SuccessDataStructure["Success Response Structure"]
        Status[status: string]
        Data[data: object]
    end
    
    subgraph ErrorDataStructure["Error Response Structure"]
        Status2[status: string]
        Message[message: string]
    end
    
    style Response fill:#f9f,stroke:#333,stroke-width:2px
    style Success fill:#bfb,stroke:#333,stroke-width:2px
    style Error fill:#fbb,stroke:#333,stroke-width:2px
```

### API Error Handling

```mermaid
flowchart TD
    Error[API Error] --> ClientError[Client Errors]
    Error --> ServerError[Server Errors]
    
    ClientError --> BadRequest[400 Bad Request]
    ClientError --> NotFound[404 Not Found]
    
    ServerError --> InternalError[500 Internal Server Error]
    
    subgraph ErrorResponses["Error Response Examples"]
        BadRequestExample["400: Invalid parameters"]
        NotFoundExample["404: Resource not found"]
        ServerErrorExample["500: Internal server error"]
    end
    
    style Error fill:#fbb,stroke:#333,stroke-width:2px
    style ClientError fill:#fdb,stroke:#333,stroke-width:2px
    style ServerError fill:#fbb,stroke:#333,stroke-width:2px
```

### API Integration Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant AI
    
    Client->>API: POST /api/v1/resumes/upload
    API->>DB: Store Resume
    DB-->>API: Resume ID
    API-->>Client: Resume Created
    
    Client->>API: POST /api/v1/resumes/:id/parse
    API->>DB: Get Resume
    DB-->>API: Resume Data
    API-->>Client: Parse Complete
    
    Client->>API: POST /api/v1/resumes/:id/analyze
    API->>AI: Analyze Content
    AI-->>API: Analysis Results
    API->>DB: Store Analysis
    API-->>Client: Analysis Complete
    
    Client->>API: POST /api/v1/resumes/:id/optimize-content
    API->>AI: Optimize Content
    AI-->>API: Optimized Content
    API->>DB: Update Content
    API-->>Client: Content Optimized
    
    Client->>API: GET /api/v1/resumes/:id/generate-pdf
    API->>DB: Get Resume
    DB-->>API: Resume Data
    API-->>Client: PDF File
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
    FE->>BE: POST /api/v1/resumes/{resumeId}/optimize-content
    BE->>BE: Prepare optimization request
    BE->>AI: Send resume content + target job
    AI-->>BE: Return optimized content
    BE-->>FE: Return optimized content
    FE->>FE: Update UI display
    
    User->>FE: Request job recommendations
    FE->>BE: GET /api/v1/resumes/{resumeId}/job-suggestions
    BE->>BE: Match jobs based on resume
    BE-->>FE: Return job matches
    FE->>FE: Display job recommendations
    
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
    Score --> JobMatchScore[Job Match Score]
    
    TechScore --> Feedback[Generate Improvement Suggestions]
    ATSScore --> Feedback
    CommScore --> Feedback
    JobMatchScore --> Feedback
    
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
    
    JobMatch[Job Matching] --> ExtractSkills[Extract Skills]
    ExtractSkills --> MatchJobs[Match with Job Database]
    MatchJobs --> RankJobs[Rank Job Matches]
    RankJobs --> ReturnMatches[Return Job Matches]
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
            JobRecommendations[Job Recommendations]
            AIContentOptimizer[AI Content Optimizer]
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
            JobMatchingService[Job Matching Service]
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
    RESUME ||--o{ JOB_MATCH : has
    
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
        number job_match_score
        array areas_for_improvement
        date analyzed_at
    }
    
    PDF {
        string id PK
        string resume_id FK
        string filename
        date generated_at
    }
    
    JOB_MATCH {
        string id PK
        string resume_id FK
        string job_title
        number match_score
        array matching_skills
        array missing_skills
        date matched_at
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
        JobAPI[Job Search API]
    end
    
    Browser <--> Frontend
    Frontend <--> Backend
    Backend <--> Database
    Backend <--> Storage
    Backend <--> OpenAI
    Backend <--> JobAPI
    
    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style Cloud fill:#bbf,stroke:#333,stroke-width:2px
    style ExternalServices fill:#fbf,stroke:#333,stroke-width:2px
``` 