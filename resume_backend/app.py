from flask import Flask, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename
import resume_parser
import resume_analyzer
import db
from bson.objectid import ObjectId
from openai import OpenAI
from dotenv import load_dotenv
import json
from flasgger import Swagger, swag_from
from flask_cors import CORS  # 导入CORS
from datetime import datetime

# 导入Swagger配置
from swagger_config import swagger_config, swagger_template
from swagger_docs import (
    upload_docs, 
    parse_docs, 
    analyze_docs, 
    list_resumes_docs, 
    get_resume_docs, 
    get_analysis_docs, 
    job_suggestions_docs, 
    compatibility_docs, 
    health_check_docs
)

# 导入PDF生成器
from resume_pdf_generator import pdf_generator

# Load environment variables
load_dotenv()

app = Flask(__name__)
# 启用CORS，允许所有来源
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['ALLOWED_EXTENSIONS'] = {'pdf'}  # 只允许PDF文件

# 初始化Swagger
swagger = Swagger(app, config=swagger_config, template=swagger_template)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Check MongoDB availability
mongodb_available = db.mongodb_available

# Configure OpenAI
openai_client = None
try:
    # 使用兼容新版本的方式初始化OpenAI客户端
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        # 简化客户端初始化，仅使用api_key参数
        openai_client = OpenAI(api_key=api_key)
        print("OpenAI client initialized successfully")
    else:
        print("Warning: OPENAI_API_KEY not found in environment variables")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# RESTful API Endpoints

# Step 1: File Upload - Directly parse and store the resume
@app.route('/api/v1/resumes/upload', methods=['POST'])
@swag_from(upload_docs)
def upload_file():
    """Upload a resume file, parse it, and store everything in one go"""
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No selected file'}), 400
    
    # 检查user_id是否提供
    user_id = request.form.get('user_id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id is required'}), 400
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # 立即使用OpenAI解析简历内容
            parsed_data = resume_parser.parse_resume(filepath)
            
            # 一次性将所有数据存储到数据库
            resume_id = db.save_resume(filename, filepath, user_id, parsed_data)
            
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': str(resume_id),
                    'filename': filename,
                    'user_id': user_id,
                    'file_type': 'pdf',
                    'parsed_data': parsed_data  # 返回解析数据
                }
            }), 201
        except Exception as e:
            return jsonify({
                'status': 'error', 
                'message': f'Error during resume upload/parsing: {str(e)}'
            }), 500
    
    return jsonify({'status': 'error', 'message': 'Only PDF files are allowed'}), 400

# Step 2: Parse Resume - For cases where content wasn't parsed during upload
@app.route('/api/v1/resumes/<resume_id>/parse', methods=['POST'])
@swag_from(parse_docs)
def parse_resume_api(resume_id):
    """Parse a previously uploaded resume file (if not already parsed)"""
    try:
        # Get the resume metadata - handle ObjectId based on MongoDB availability
        if mongodb_available:
            resume = db.get_resume(ObjectId(resume_id))
        else:
            resume = db.get_resume(resume_id)
            
        if not resume:
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
        
        # Check if resume already has parsed content
        if 'content' in resume and resume['content'] and resume['status'] == 'parsed':
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': resume_id,
                    'content': resume['content'],
                    'message': 'Resume was already parsed'
                }
            })
        
        # Resume needs parsing
        try:
            # Get file path
            if 'filepath' in resume:
                filepath = resume['filepath']
            else:
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], resume['filename'])
            
            # Parse resume content using OpenAI
            parsed_data = resume_parser.parse_resume(filepath)
            
            # Update the resume with parsed content
            if mongodb_available:
                db.update_resume_content(ObjectId(resume_id), parsed_data)
            else:
                db.update_resume_content(resume_id, parsed_data)
            
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': resume_id,
                    'content': parsed_data,
                    'message': 'Resume parsed successfully using OpenAI'
                }
            })
        except Exception as parse_error:
            return jsonify({
                'status': 'error', 
                'message': f'Failed to parse resume: {str(parse_error)}'
            }), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Step 3: Analyze Resume - Generate analysis using LLM
@app.route('/api/v1/resumes/<resume_id>/analyze', methods=['POST'])
@swag_from(analyze_docs)
def analyze_resume_api(resume_id):
    """Analyze a previously parsed resume"""
    try:
        # Get the resume - handle ObjectId based on MongoDB availability
        if mongodb_available:
            resume = db.get_resume(ObjectId(resume_id))
        else:
            resume = db.get_resume(resume_id)
            
        if not resume:
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
        
        # Check if the resume has been parsed
        if 'content' not in resume or not resume['content']:
            return jsonify({'status': 'error', 'message': 'Resume has not been parsed yet'}), 400
        
        # Analyze resume
        analysis = resume_analyzer.analyze_resume(resume['content'])
        
        # Save analysis to database - handle ObjectId based on MongoDB availability
        if mongodb_available:
            analysis_id = db.save_analysis(ObjectId(resume_id), analysis)
        else:
            analysis_id = db.save_analysis(resume_id, analysis)
        
        return jsonify({
            'status': 'success',
            'data': {
                'resume_id': resume_id,
                'analysis_id': str(analysis_id),
                'analysis': analysis
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# List all resumes for a user
@app.route('/api/v1/resumes', methods=['GET'])
@swag_from(list_resumes_docs)
def list_resumes():
    """List all resumes for a user"""
    try:
        # Get user_id from query parameter
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'status': 'error', 'message': 'user_id parameter is required'}), 400
            
        # Query resumes collection for this user
        resumes_cursor = db.get_resumes_by_user(user_id)
        
        # Convert cursor to list and prepare for JSON serialization
        resumes = []
        for resume in resumes_cursor:
            resume['_id'] = str(resume['_id'])
            # Convert datetime to string if it exists
            if 'upload_date' in resume and hasattr(resume['upload_date'], 'isoformat'):
                resume['upload_date'] = resume['upload_date'].isoformat()
            resumes.append(resume)
            
        return jsonify({
            'status': 'success',
            'data': {
                'resumes': resumes
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Get a specific resume
@app.route('/api/v1/resumes/<resume_id>', methods=['GET'])
@swag_from(get_resume_docs)
def get_resume(resume_id):
    """Get a specific resume by ID"""
    try:
        # Handle ObjectId based on MongoDB availability
        if mongodb_available:
            resume = db.get_resume(ObjectId(resume_id))
        else:
            resume = db.get_resume(resume_id)
            
        if resume:
            # Convert ObjectId to string for JSON serialization if using MongoDB
            if mongodb_available and '_id' in resume:
                resume['_id'] = str(resume['_id'])
            return jsonify({
                'status': 'success',
                'data': resume
            })
        else:
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Analyses resource
@app.route('/api/v1/analyses/<resume_id>', methods=['GET'])
@swag_from(get_analysis_docs)
def get_analysis(resume_id):
    """Get the analysis for a specific resume"""
    try:
        # Handle ObjectId based on MongoDB availability
        if mongodb_available:
            analysis = db.get_analysis(ObjectId(resume_id))
        else:
            analysis = db.get_analysis(resume_id)
            
        if analysis:
            # Convert ObjectId to string for JSON serialization if using MongoDB
            if mongodb_available:
                if '_id' in analysis:
                    analysis['_id'] = str(analysis['_id'])
                if 'resume_id' in analysis:
                    analysis['resume_id'] = str(analysis['resume_id'])
            return jsonify({
                'status': 'success',
                'data': analysis
            })
        else:
            return jsonify({'status': 'error', 'message': 'Analysis not found'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Job suggestions resource
@app.route('/api/v1/resumes/<resume_id>/job-suggestions', methods=['GET'])
@swag_from(job_suggestions_docs)
def get_job_suggestions(resume_id):
    """Get job suggestions based on a resume"""
    try:
        # Get resume and analysis - handle ObjectId based on MongoDB availability
        if mongodb_available:
            resume = db.get_resume(ObjectId(resume_id))
            analysis = db.get_analysis(ObjectId(resume_id))
        else:
            resume = db.get_resume(resume_id)
            analysis = db.get_analysis(resume_id)
        
        if not resume or not analysis:
            return jsonify({'status': 'error', 'message': 'Resume or analysis not found'}), 404
            
        # 提取关键信息
        resume_content = resume['content'] 
        analysis_data = analysis['analysis']
        
        # 将结构化JSON转换为字符串表示，以便传递给OpenAI
        if isinstance(resume_content, dict):
            resume_content_str = json.dumps(resume_content, indent=2)
        else:
            resume_content_str = str(resume_content)
        
        # Check if OpenAI client is available
        if openai_client:
            try:
                # Use OpenAI to generate job suggestions
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a career advisor specializing in job recommendations."},
                        {"role": "user", "content": f"""
                        Based on the following parsed resume and its analysis, suggest 5 specific job positions 
                        that would be a good fit for this candidate. For each position, provide:
                        1. Job title
                        2. Required skills the candidate already has
                        3. Skills they might need to develop
                        4. Potential companies that hire for this role
                        5. Estimated salary range
                        
                        Format your response as a JSON array with these fields.
                        
                        Parsed Resume:
                        {resume_content_str}
                        
                        Analysis:
                        {analysis_data}
                        """}
                    ],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                
                # Parse the suggestions
                suggestions_json = response.choices[0].message.content
                suggestions = json.loads(suggestions_json)
                
                return jsonify({
                    'status': 'success',
                    'data': {
                        'resume_id': resume_id,
                        'job_suggestions': suggestions
                    }
                })
                
            except Exception as e:
                print(f"Error with OpenAI API: {e}")
                # Fall back to mock suggestions
                return jsonify({
                    'status': 'success',
                    'data': {
                        'resume_id': resume_id,
                        'job_suggestions': generate_mock_job_suggestions(resume_content_str),
                    },
                    'meta': {
                        'source': 'fallback',
                        'reason': 'API error'
                    }
                })
        else:
            # Use mock suggestions when OpenAI is not available
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': resume_id,
                    'job_suggestions': generate_mock_job_suggestions(resume_content_str),
                },
                'meta': {
                    'source': 'fallback',
                    'reason': 'OpenAI not available'
                }
            })
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Health check endpoint
@app.route('/api/v1/health', methods=['GET'])
@swag_from(health_check_docs)
def health_check():
    """Health check endpoint for container monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0',
        'services': {
            'database': 'ok' if mongodb_available else 'using local storage',
            'openai': 'ok' if openai_client else 'unavailable'
        }
    })

# Compatibility API - Upload and analyze in a single request
@app.route('/api/resumes', methods=['POST'])
@swag_from(compatibility_docs)
def upload_and_analyze_resume():
    """Legacy endpoint to upload and analyze a resume in one step"""
    try:
        # 检查上传文件
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file part'}), 400
        
        file = request.files['file']
        
        # 检查user_id
        user_id = request.form.get('user_id')
        if not user_id:
            return jsonify({'status': 'error', 'message': 'Missing user_id parameter'}), 400
        
        # 检查文件名和类型
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'status': 'error', 'message': 'Only PDF files are allowed'}), 415
        
        # 确保上传目录存在
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # 安全保存文件
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # 使用OpenAI解析简历
        parsed_data = resume_parser.parse_resume(filepath)
        
        # 一次性存储简历和解析内容
        resume_id = db.save_resume(filename, filepath, user_id, parsed_data)
        
        # 分析简历
        analysis = resume_analyzer.analyze_resume(parsed_data)
        
        # 保存分析结果
        if mongodb_available:
            # 检查resume_id是否已经是ObjectId实例
            if not isinstance(resume_id, ObjectId):
                resume_id_obj = ObjectId(resume_id)
            else:
                resume_id_obj = resume_id
            analysis_id = db.save_analysis(resume_id_obj, analysis)
        else:
            analysis_id = db.save_analysis(resume_id, analysis)
        
        # 返回结果
        return jsonify({
            'status': 'success',
            'data': {
                'resume_id': str(resume_id),
                'parsed_content': parsed_data,
                'analysis': analysis
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def generate_mock_job_suggestions(resume_text):
    """Generate mock job suggestions when OpenAI is not available"""
    # Look for keywords in the resume to determine job suggestions
    keywords = {
        "python": ["Python Developer", "Data Scientist", "Backend Engineer"],
        "javascript": ["Frontend Developer", "Full Stack Developer", "Web Developer"],
        "react": ["React Developer", "Frontend Engineer", "UI Developer"],
        "data": ["Data Analyst", "Data Scientist", "Business Intelligence Analyst"],
        "cloud": ["Cloud Engineer", "DevOps Engineer", "Solutions Architect"],
        "security": ["Security Engineer", "Security Analyst", "Cybersecurity Specialist"],
        "manager": ["Product Manager", "Project Manager", "Engineering Manager"],
    }
    
    # Default jobs if no matches
    default_jobs = [
        {
            "job_title": "Software Engineer",
            "required_skills": ["Programming", "Problem Solving", "Teamwork"],
            "skills_to_develop": ["System Design", "DevOps", "Cloud Architecture"],
            "potential_companies": ["Google", "Microsoft", "Amazon"],
            "salary_range": "$90,000 - $130,000"
        },
        {
            "job_title": "Full Stack Developer",
            "required_skills": ["Frontend", "Backend", "Database"],
            "skills_to_develop": ["Mobile Development", "UI/UX Design", "Performance Optimization"],
            "potential_companies": ["Facebook", "Twitter", "Shopify"],
            "salary_range": "$85,000 - $125,000"
        }
    ]
    
    # Find matching jobs based on keywords
    matching_jobs = []
    resume_lower = resume_text.lower()
    
    for keyword, job_titles in keywords.items():
        if keyword in resume_lower:
            for job_title in job_titles:
                if len(matching_jobs) < 5 and not any(job['job_title'] == job_title for job in matching_jobs):
                    matching_jobs.append({
                        "job_title": job_title,
                        "required_skills": ["Programming", "Problem Solving", "Communication"],
                        "skills_to_develop": ["System Design", "Leadership", "Domain Expertise"],
                        "potential_companies": ["Google", "Microsoft", "Amazon", "Meta", "Apple"],
                        "salary_range": "$90,000 - $140,000"
                    })
    
    # If we have less than 5 jobs, add some default ones
    while len(matching_jobs) < 5:
        for job in default_jobs:
            if len(matching_jobs) < 5 and not any(m_job['job_title'] == job['job_title'] for m_job in matching_jobs):
                matching_jobs.append(job)
    
    return matching_jobs

# Maintain backward compatibility with old endpoints
@app.route('/upload', methods=['POST'])
def upload_resume():
    """Legacy endpoint for resume upload"""
    return upload_and_analyze_resume()

@app.route('/resume/<resume_id>', methods=['GET'])
def get_resume_legacy(resume_id):
    """Legacy endpoint for getting resume"""
    # Handle the case when MongoDB is not available
    if mongodb_available:
        return get_resume(resume_id)
    else:
        # Manually call the function with proper handling
        try:
            resume = db.get_resume(resume_id)
            if resume:
                # 处理简历内容格式
                if 'content' in resume and isinstance(resume['content'], dict):
                    # 确保内容可以序列化为JSON
                    resume['content'] = json.dumps(resume['content'])
                
                return jsonify({
                    'status': 'success',
                    'data': resume
                })
            else:
                return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/analysis/<resume_id>', methods=['GET'])
def get_analysis_legacy(resume_id):
    """Legacy endpoint for getting analysis"""
    # Handle the case when MongoDB is not available
    if mongodb_available:
        return get_analysis(resume_id)
    else:
        # Manually call the function with proper handling
        try:
            analysis = db.get_analysis(resume_id)
            if analysis:
                return jsonify({
                    'status': 'success',
                    'data': analysis
                })
            else:
                return jsonify({'status': 'error', 'message': 'Analysis not found'}), 404
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/job-suggestions/<resume_id>', methods=['GET'])
def get_job_suggestions_legacy(resume_id):
    """Legacy endpoint for getting job suggestions"""
    # Handle the case when MongoDB is not available
    if mongodb_available:
        return get_job_suggestions(resume_id)
    else:
        # Manually call the function with proper handling
        try:
            resume = db.get_resume(resume_id)
            analysis = db.get_analysis(resume_id)
            
            if not resume or not analysis:
                return jsonify({'status': 'error', 'message': 'Resume or analysis not found'}), 404
                
            # Extract key information from resume and analysis
            resume_content = resume['content']
            analysis_data = analysis['analysis']
            
            # Use mock suggestions
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': resume_id,
                    'job_suggestions': generate_mock_job_suggestions(resume_content),
                },
                'meta': {
                    'source': 'fallback',
                    'reason': 'In-memory database mode'
                }
            })
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check_legacy():
    """Legacy health check endpoint"""
    return health_check()

# Add new API endpoint to update resume content
@app.route('/api/v1/resumes/<resume_id>/content', methods=['PUT'])
def update_resume_content_api(resume_id):
    """Update resume content with edited data"""
    try:
        # Get the request data
        request_data = request.json
        if not request_data or 'content' not in request_data:
            return jsonify({'status': 'error', 'message': 'Content is required'}), 400
            
        content = request_data['content']
        
        # Convert resume_id to ObjectId if using MongoDB
        if mongodb_available:
            try:
                resume_id = ObjectId(resume_id)
            except:
                pass
        
        # Check if resume exists
        resume = db.get_resume(resume_id)
        if not resume:
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
            
        # Update the resume content
        result = db.update_resume_content(resume_id, content)
        
        if result:
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': str(resume_id),
                    'message': 'Resume content updated successfully'
                }
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to update resume content'
            }), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add new API endpoint to download optimized resume
@app.route('/api/v1/resumes/<resume_id>/download', methods=['GET'])
def download_resume_api(resume_id):
    """Download the optimized resume as PDF"""
    try:
        print(f"Downloading resume with ID: {resume_id}")
        
        # Convert resume_id to ObjectId if using MongoDB
        if mongodb_available:
            try:
                resume_id = ObjectId(resume_id)
                print(f"Converted to ObjectId: {resume_id}")
            except Exception as e:
                print(f"Error converting to ObjectId: {e}")
                pass
                
        # Get the resume
        resume = db.get_resume(resume_id)
        if not resume:
            print(f"Resume not found in database: {resume_id}")
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
            
        print(f"Resume found in database: {resume}")
            
        # Get the file path
        if 'filepath' in resume and resume['filepath']:
            # If filepath is relative, make it absolute
            if not os.path.isabs(resume['filepath']):
                filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), resume['filepath'])
            else:
                filepath = resume['filepath']
            print(f"Using filepath from database: {filepath}")
        else:
            filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), app.config['UPLOAD_FOLDER'], resume['filename'])
            print(f"Using constructed filepath: {filepath}")
            
        if not os.path.exists(filepath):
            print(f"File not found at path: {filepath}")
            return jsonify({'status': 'error', 'message': 'Resume file not found'}), 404
            
        print(f"File exists at path: {filepath}")
        
        try:
            return send_file(
                filepath,
                as_attachment=True,
                download_name=f"optimized_{resume['filename']}",
                mimetype='application/pdf'
            )
        except Exception as e:
            print(f"Error sending file: {e}")
            return jsonify({'status': 'error', 'message': f'Error sending file: {str(e)}'}), 500
            
    except Exception as e:
        print(f"Unexpected error in download_resume_api: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add new API endpoint to optimize specific resume content
@app.route('/api/v1/resumes/<resume_id>/optimize-content', methods=['POST'])
def optimize_resume_content(resume_id):
    """Optimize specific resume content (section or bullet point) using AI"""
    try:
        # 获取请求数据
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400
            
        required_fields = ['sectionKey', 'currentContent']
        for field in required_fields:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'Missing required field: {field}'}), 400
        
        # 提取优化所需信息
        section_key = data['sectionKey']
        current_content = data['currentContent']
        job_title = data.get('jobTitle', '')
        
        # 检查原始内容的格式前缀
        starts_with_dash = current_content.lstrip().startswith("- ")
        starts_with_bullet = current_content.lstrip().startswith("• ")
        
        # 保存原始前缀
        prefix = ""
        content_for_ai = current_content
        
        if starts_with_dash:
            prefix = "- "
            content_for_ai = current_content.lstrip()[2:]
        elif starts_with_bullet:
            prefix = "• "
            content_for_ai = current_content.lstrip()[2:]
        
        # 构建提示词
        prompt_context = f"Job Target: {job_title}\n" if job_title else ""
        
        if 'itemIndex' in data and data['itemIndex'] is not None:
            context = f"This is a bullet point in the {section_key} section of a resume."
        else:
            context = f"This is the {section_key} section of a resume."
        
        # 检查OpenAI客户端是否可用
        if openai_client:
            try:
                # 使用OpenAI生成优化内容
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an expert resume writer with years of experience helping job seekers create compelling, ATS-friendly resumes. You excel at turning basic content into powerful, achievement-focused bullets that emphasize results and skills."},
                        {"role": "user", "content": f"""
                        {prompt_context}
                        {context}
                        
                        Original content:
                        "{content_for_ai}"
                        
                        Please optimize this content to make it more impactful, professional, and ATS-friendly. Focus on:
                        1. Using strong action verbs
                        2. Quantifying achievements when possible
                        3. Highlighting relevant skills
                        4. Maintaining conciseness and clarity
                        5. Making it keyword-rich for ATS systems
                        
                        DO NOT include any bullet point markers like "- " or "• " at the beginning of your response.
                        Provide only the optimized content as your response, with no additional explanations.
                        """}
                    ],
                    temperature=0.3,
                )
                
                # 获取优化后的内容
                optimized_content = response.choices[0].message.content.strip()
                
                # 移除可能的引号
                if optimized_content.startswith('"') and optimized_content.endswith('"'):
                    optimized_content = optimized_content[1:-1]
                
                # 移除AI可能添加的前缀
                optimized_content = optimized_content.lstrip("- ").lstrip("• ")
                
                # 还原原始前缀
                if prefix:
                    optimized_content = f"{prefix}{optimized_content}"
                
                return jsonify({
                    'status': 'success',
                    'data': {
                        'originalContent': current_content,
                        'optimizedContent': optimized_content
                    }
                })
                
            except Exception as openai_error:
                return jsonify({
                    'status': 'error',
                    'message': f'OpenAI API error: {str(openai_error)}'
                }), 500
        else:
            return jsonify({
                'status': 'error',
                'message': 'OpenAI client not available'
            }), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/v1/resumes/<resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    """Delete a specific resume by ID"""
    try:
        # Handle ObjectId based on MongoDB availability
        if mongodb_available:
            result = db.delete_resume(ObjectId(resume_id))
        else:
            result = db.delete_resume(resume_id)
            
        if result:
            return jsonify({
                'status': 'success',
                'message': 'Resume deleted successfully'
            })
        else:
            return jsonify({'status': 'error', 'message': 'Resume not found or could not be deleted'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# 添加新API端点来生成自定义简历PDF
@app.route('/api/v1/resumes/<resume_id>/generate-pdf', methods=['GET'])
def generate_resume_pdf(resume_id):
    """Generate a custom formatted PDF resume"""
    try:
        print(f"Generating PDF for resume with ID: {resume_id}")
        
        # 转换ID格式（如果使用MongoDB）
        if mongodb_available:
            try:
                resume_id = ObjectId(resume_id)
                print(f"Converted to ObjectId: {resume_id}")
            except Exception as e:
                print(f"Error converting to ObjectId: {e}")
                pass
                
        # 获取简历数据
        resume = db.get_resume(resume_id)
        if not resume:
            print(f"Resume not found in database: {resume_id}")
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
            
        print(f"Resume found in database: {resume}")
        
        # 确保内容已解析
        if not resume.get('content'):
            print(f"Resume content not parsed: {resume_id}")
            return jsonify({'status': 'error', 'message': 'Resume content not parsed'}), 400
            
        # 使用PDF生成器生成PDF
        try:
            output_filename = f"resume_{str(resume_id)}.pdf"
            pdf_path = pdf_generator.generate(resume['content'], output_filename)
            
            print(f"PDF generated successfully at: {pdf_path}")
            
            # 返回生成的PDF
            return send_file(
                pdf_path,
                as_attachment=True,
                download_name=f"resume_{str(resume_id)}.pdf",
                mimetype='application/pdf'
            )
        except Exception as e:
            print(f"Error generating PDF: {e}")
            return jsonify({'status': 'error', 'message': f'Error generating PDF: {str(e)}'}), 500
            
    except Exception as e:
        print(f"Unexpected error in generate_resume_pdf: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add a new endpoint to extract keywords from a resume for job matching
@app.route('/api/v1/resumes/<resume_id>/extract-keywords', methods=['GET'])
def extract_resume_keywords(resume_id):
    """Extract keywords and skills from a resume for job matching"""
    try:
        # Get resume data - handle ObjectId based on MongoDB availability
        if mongodb_available:
            resume = db.get_resume(ObjectId(resume_id))
        else:
            resume = db.get_resume(resume_id)
        
        if not resume:
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
            
        # Extract resume content
        resume_content = resume['content'] 
        
        # Convert structured JSON to string for OpenAI
        if isinstance(resume_content, dict):
            resume_content_str = json.dumps(resume_content, indent=2)
        else:
            resume_content_str = str(resume_content)
        
        # Check if OpenAI client is available
        if openai_client:
            try:
                # Use OpenAI to extract keywords
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are an AI assistant that extracts relevant keywords from resumes for job matching."},
                        {"role": "user", "content": f"""
                        Extract relevant keywords from the following resume content that would be useful for job matching.
                        Focus on:
                        1. Technical skills (programming languages, tools, frameworks)
                        2. Industry-specific skills
                        3. Soft skills
                        4. Educational qualifications
                        5. Certifications
                        6. Key achievements and metrics
                        
                        Return ONLY a JSON object with a single key "keywords" containing an array of strings.
                        Each keyword should be a single word or short phrase (1-3 words maximum).
                        Do not include explanations or descriptions.
                        
                        Resume Content:
                        {resume_content_str}
                        """}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                
                # Parse the keywords
                keywords_json = response.choices[0].message.content
                keywords_data = json.loads(keywords_json)
                
                return jsonify({
                    'status': 'success',
                    'data': {
                        'resume_id': resume_id,
                        'keywords': keywords_data.get('keywords', [])
                    }
                })
                
            except Exception as e:
                print(f"Error with OpenAI API: {e}")
                # Fall back to basic keyword extraction
                return jsonify({
                    'status': 'success',
                    'data': {
                        'resume_id': resume_id,
                        'keywords': extract_basic_keywords(resume_content_str)
                    },
                    'meta': {
                        'source': 'fallback',
                        'reason': 'API error'
                    }
                })
        else:
            # Use basic keyword extraction when OpenAI is not available
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': resume_id,
                    'keywords': extract_basic_keywords(resume_content_str)
                },
                'meta': {
                    'source': 'fallback',
                    'reason': 'OpenAI not available'
                }
            })
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def extract_basic_keywords(resume_text):
    """Basic keyword extraction when OpenAI is not available"""
    # Common technical skills to look for
    tech_skills = [
        "python", "javascript", "java", "c++", "c#", "ruby", "go", "php",
        "react", "angular", "vue", "node.js", "django", "flask", "spring",
        "tensorflow", "pytorch", "pandas", "numpy", "sql", "nosql", "mongodb",
        "mysql", "postgresql", "aws", "azure", "gcp", "docker", "kubernetes",
        "ci/cd", "git", "rest api", "graphql", "html", "css", "sass",
        "machine learning", "deep learning", "nlp", "data science", "data analysis"
    ]
    
    # Common soft skills
    soft_skills = [
        "leadership", "teamwork", "communication", "problem solving", 
        "critical thinking", "project management", "time management",
        "collaboration", "adaptability", "creativity", "organization"
    ]
    
    # Extract keywords by checking if they appear in the resume
    keywords = []
    
    # Convert resume text to lowercase for case-insensitive matching
    resume_lower = resume_text.lower()
    
    # Check for tech skills
    for skill in tech_skills:
        if skill in resume_lower:
            keywords.append(skill)
    
    # Check for soft skills
    for skill in soft_skills:
        if skill in resume_lower:
            keywords.append(skill)
    
    return keywords

# 添加一个新的API端点，将简历内容转换为单个字符串
@app.route('/api/v1/resumes/<resume_id>/content-string', methods=['GET'])
def get_resume_content_string(resume_id):
    """获取简历内容作为一个单一字符串用于工作匹配"""
    try:
        # 获取简历数据 - 根据MongoDB可用性处理ObjectId
        if mongodb_available:
            resume = db.get_resume(ObjectId(resume_id))
        else:
            resume = db.get_resume(resume_id)
        
        if not resume:
            return jsonify({'status': 'error', 'message': 'Resume not found'}), 404
            
        # 提取简历内容
        resume_content = resume.get('content', {})
        
        # 如果OpenAI客户端可用，使用它来生成更好的内容字符串
        if openai_client:
            try:
                # 将结构化JSON转换为字符串
                if isinstance(resume_content, dict):
                    resume_content_str = json.dumps(resume_content, indent=2)
                else:
                    resume_content_str = str(resume_content)
                
                # 使用OpenAI生成内容字符串
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "你是一个简历内容提取器，你的任务是从简历JSON中提取出所有重要信息，形成一个完整的字符串，用于工作匹配。"},
                        {"role": "user", "content": f"""
                        从以下简历内容中提取所有重要信息（工作经历、技能、教育背景、项目经验等），
                        将它们整合成一个单一的文本字符串，格式为：
                        
                        "[职位/角色] [描述] ● [成就/责任点1] ● [成就/责任点2] ● ..."
                        
                        保留所有技术关键词、成就数据和重要技能。仅返回最终提取的文本，不要添加任何解释。
                        
                        简历内容:
                        {resume_content_str}
                        """}
                    ],
                    temperature=0.1,
                )
                
                # 获取生成的内容字符串
                content_string = response.choices[0].message.content.strip()
                
                return jsonify({
                    'status': 'success',
                    'data': {
                        'resume_id': resume_id,
                        'content_string': content_string
                    }
                })
                
            except Exception as e:
                print(f"OpenAI API错误: {e}")
                # 回退到基本内容提取
                content_string = extract_basic_resume_string(resume_content)
                return jsonify({
                    'status': 'success',
                    'data': {
                        'resume_id': resume_id,
                        'content_string': content_string
                    },
                    'meta': {
                        'source': 'fallback',
                        'reason': 'API错误'
                    }
                })
        else:
            # 当OpenAI不可用时使用基本内容提取
            content_string = extract_basic_resume_string(resume_content)
            return jsonify({
                'status': 'success',
                'data': {
                    'resume_id': resume_id,
                    'content_string': content_string
                },
                'meta': {
                    'source': 'fallback',
                    'reason': 'OpenAI不可用'
                }
            })
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def extract_basic_resume_string(resume_content):
    """当OpenAI不可用时的基本简历内容提取"""
    result = []
    
    # 如果resume_content是字典类型
    if isinstance(resume_content, dict):
        # 提取个人信息
        if 'personal_info' in resume_content:
            personal = resume_content.get('personal_info', {})
            if isinstance(personal, dict):
                name = personal.get('name', '')
                title = personal.get('title', '')
                if name or title:
                    result.append(f"{name} - {title}")
        
        # 提取摘要
        if 'summary' in resume_content and resume_content['summary']:
            result.append(resume_content['summary'])
        
        # 提取工作经验
        if 'experience' in resume_content and isinstance(resume_content['experience'], list):
            for job in resume_content['experience']:
                if isinstance(job, dict):
                    company = job.get('company', '')
                    position = job.get('position', '')
                    job_info = f"{position} at {company}"
                    result.append(job_info)
                    
                    # 提取工作职责/成就
                    responsibilities = job.get('responsibilities', [])
                    if isinstance(responsibilities, list):
                        for resp in responsibilities:
                            if resp:
                                result.append(f"● {resp}")
        
        # 提取技能
        if 'skills' in resume_content and isinstance(resume_content['skills'], dict):
            skills = resume_content['skills']
            for category, skill_list in skills.items():
                if isinstance(skill_list, list):
                    skill_text = ", ".join(skill_list)
                    result.append(f"{category.replace('_', ' ').title()}: {skill_text}")
                elif isinstance(skill_list, str):
                    result.append(f"{category.replace('_', ' ').title()}: {skill_list}")
        
        # 提取教育背景
        if 'education' in resume_content and isinstance(resume_content['education'], list):
            for edu in resume_content['education']:
                if isinstance(edu, dict):
                    institution = edu.get('institution', '')
                    degree = edu.get('degree', '')
                    edu_info = f"{degree} from {institution}"
                    result.append(edu_info)
    
    # 如果resume_content是字符串
    elif isinstance(resume_content, str):
        result.append(resume_content)
    
    # 将所有内容连接成一个字符串
    return " ".join(result)

if __name__ == '__main__':
    # Use port 8080 instead of 5000 which is used by AirPlay on Mac
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True) 