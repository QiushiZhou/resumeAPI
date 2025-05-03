import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId
import datetime

# 加载 .env 配置
load_dotenv()

# MongoDB 连接字符串 
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://admin:admin@cluster0.2am5w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

# 标记MongoDB可用性
mongodb_available = False

# 内存中的集合类，用作MongoDB的备用方案
class MemoryCollection:
    def __init__(self, name):
        self.name = name
        self.data = []
        self.counter = 1
        
    def insert_one(self, document):
        # 如果没有_id则添加一个
        if '_id' not in document:
            document['_id'] = str(self.counter)
            self.counter += 1
        
        self.data.append(document)
        
        class Result:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
                
        return Result(document['_id'])
    
    def find_one(self, query):
        # 简单的查询匹配
        for doc in self.data:
            match = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                return doc
        return None
    
    def find(self, query=None):
        if query is None:
            # 返回所有文档
            return self.data
        
        # 基本查询匹配
        results = []
        for doc in self.data:
            match = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            if match:
                results.append(doc)
        return results
    
    def update_one(self, query, update):
        # 查找文档并更新
        for i, doc in enumerate(self.data):
            match = True
            for key, value in query.items():
                if key not in doc or doc[key] != value:
                    match = False
                    break
            
            if match:
                # 处理$set操作符
                if '$set' in update:
                    for key, value in update['$set'].items():
                        self.data[i][key] = value
                return True
        return False

try:
    # 连接 MongoDB
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # 测试连接
    client.admin.command('ping')
    print("✅ MongoDB Atlas 连接成功！")
    mongodb_available = True
    
    # 获取数据库和集合
    db = client.resume_db
    resumes = db.resumes
    analyses = db.analyses
    
except Exception as e:
    print(f"❌ MongoDB 连接失败: {e}")
    print("使用内存存储作为备用方案")
    
    # 创建内存集合作为备用
    resumes = MemoryCollection("resumes")
    analyses = MemoryCollection("analyses")

def save_resume_metadata(filename, filepath, user_id=None):
    """Save resume metadata to database (legacy function)"""
    try:
        timestamp = datetime.datetime.now()
        
        resume_data = {
            "filename": filename,
            "filepath": filepath,
            "upload_date": timestamp,
            "status": "uploaded",
        }
        
        if user_id:
            resume_data["user_id"] = user_id
        
        result = resumes.insert_one(resume_data)
        return result.inserted_id
    except Exception as e:
        print(f"Error saving resume metadata: {e}")
        return None

def update_resume_content(resume_id, content):
    """Update resume with extracted content"""
    try:
        if mongodb_available and isinstance(resume_id, str):
            try:
                resume_id = ObjectId(resume_id)
            except:
                pass
                
        resumes.update_one(
            {"_id": resume_id},
            {"$set": {
                "content": content,
                "status": "parsed"
            }}
        )
        return True
    except Exception as e:
        print(f"Error updating resume content: {e}")
        return False

def save_resume(filename, filepath, user_id=None, parsed_data=None):
    """保存简历数据，包括元数据和解析数据"""
    try:
        timestamp = datetime.datetime.now()
        
        resume_data = {
            "filename": filename,
            "filepath": filepath,
            "upload_date": timestamp,
            "status": "parsed",  # 标记为已解析
            "content": parsed_data  # 存储解析内容
        }
        
        if user_id:
            resume_data["user_id"] = user_id
        
        result = resumes.insert_one(resume_data)
        return result.inserted_id
    except Exception as e:
        print(f"Error saving resume with parsed data: {e}")
        return None

def save_analysis(resume_id, analysis_data):
    """Save analysis data for a resume"""
    try:
        if mongodb_available and isinstance(resume_id, str):
            try:
                resume_id = ObjectId(resume_id)
            except:
                pass
                
        timestamp = datetime.datetime.now()
        
        analysis = {
            "resume_id": resume_id,
            "analysis": analysis_data,
            "date": timestamp
        }
        
        result = analyses.insert_one(analysis)
        return result.inserted_id
    except Exception as e:
        print(f"Error saving analysis: {e}")
        return None

def get_resume(resume_id):
    """Get a resume by ID"""
    try:
        if mongodb_available:
            if isinstance(resume_id, str):
                try:
                    resume_id = ObjectId(resume_id)
                except:
                    pass
            return resumes.find_one({"_id": resume_id})
        else:
            # For in-memory storage, convert ObjectId to int if needed
            if isinstance(resume_id, ObjectId):
                resume_id = str(resume_id)
            return resumes.find_one({"_id": resume_id})
    except Exception as e:
        print(f"Error getting resume: {e}")
        return None

def get_analysis(resume_id):
    """Get analysis for a specific resume"""
    try:
        if mongodb_available:
            if isinstance(resume_id, str):
                try:
                    resume_id = ObjectId(resume_id)
                except:
                    pass
            return analyses.find_one({"resume_id": resume_id})
        else:
            # For in-memory storage, convert ObjectId to int if needed
            if isinstance(resume_id, ObjectId):
                resume_id = str(resume_id)
            return analyses.find_one({"resume_id": resume_id})
    except Exception as e:
        print(f"Error getting analysis: {e}")
        return None

def get_resumes_by_user(user_id):
    """Get all resumes for a specific user"""
    try:
        if mongodb_available:
            # Return a cursor for MongoDB
            return resumes.find({"user_id": user_id})
        else:
            # For in-memory storage, return a list
            return resumes.find({"user_id": user_id})
    except Exception as e:
        print(f"Error getting resumes by user: {e}")
        return []

def delete_resume(resume_id):
    """Delete a resume by ID and its associated analysis"""
    global analyses, resumes  # 同时声明两个全局变量
    
    try:
        # First delete associated analysis
        if mongodb_available:
            analyses.delete_one({"resume_id": resume_id})
        else:
            # 对于内存存储，更新全局变量analyses
            analyses = [a for a in analyses if a.get("resume_id") != resume_id]
        
        # Then delete the resume
        if mongodb_available:
            result = resumes.delete_one({"_id": resume_id})
            return result.deleted_count > 0
        else:
            # For in-memory storage
            original_len = len(resumes)
            resumes = [r for r in resumes if r.get("_id") != resume_id]
            return len(resumes) < original_len
    except Exception as e:
        print(f"Error deleting resume: {e}")
        return False 