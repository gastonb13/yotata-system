const { Document, User, ActivityLog } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/documents');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

class DocumentController {
    async getAllDocuments(req, res) {
        try {
            const { page = 1, limit = 10, document_type, reference_type } = req.query;
            const offset = (page - 1) * limit;
            
            const where = {};
            if (document_type) where.document_type = document_type;
            if (reference_type) where.reference_type = reference_type;
            
            const documents = await Document.findAndCountAll({
                where,
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [{ model: User, as: 'uploader', attributes: ['id', 'email'] }],
                order: [['created_at', 'DESC']]
            });
            
            res.json({
                success: true,
                documents: documents.rows,
                total: documents.count,
                page: parseInt(page),
                totalPages: Math.ceil(documents.count / limit)
            });
        } catch (error) {
            console.error('Get documents error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching documents'
            });
        }
    }
    
    async uploadDocument(req, res) {
        try {
            upload.single('file')(req, res, async (err) => {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file uploaded'
                    });
                }
                
                const { document_type, reference_id, reference_type, title, notes } = req.body;
                
                const document = await Document.create({
                    document_type,
                    reference_id: parseInt(reference_id),
                    reference_type,
                    title,
                    file_path: req.file.path,
                    file_name: req.file.originalname,
                    file_size: req.file.size,
                    mime_type: req.file.mimetype,
                    uploaded_by: req.user.id,
                    notes,
                    status: 'final'
                });
                
                await ActivityLog.create({
                    user_id: req.user.id,
                    action: 'UPLOAD_DOCUMENT',
                    details: JSON.stringify({ document_id: document.id, title }),
                    ip_address: req.ip
                });
                
                res.status(201).json({
                    success: true,
                    message: 'Document uploaded successfully',
                    document
                });
            });
        } catch (error) {
            console.error('Upload document error:', error);
            res.status(500).json({
                success: false,
                message: 'Error uploading document'
            });
        }
    }
    
    async getDocumentById(req, res) {
        try {
            const { id } = req.params;
            const document = await Document.findByPk(id, {
                include: [{ model: User, as: 'uploader', attributes: ['id', 'email'] }]
            });
            
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
            
            res.json({
                success: true,
                document
            });
        } catch (error) {
            console.error('Get document error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching document'
            });
        }
    }
    
    async downloadDocument(req, res) {
        try {
            const { id } = req.params;
            const document = await Document.findByPk(id);
            
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
            
            if (!fs.existsSync(document.file_path)) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on server'
                });
            }
            
            res.download(document.file_path, document.file_name);
        } catch (error) {
            console.error('Download document error:', error);
            res.status(500).json({
                success: false,
                message: 'Error downloading document'
            });
        }
    }
    
    async deleteDocument(req, res) {
        try {
            const { id } = req.params;
            const document = await Document.findByPk(id);
            
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }
            
            // Delete file from filesystem
            if (fs.existsSync(document.file_path)) {
                fs.unlinkSync(document.file_path);
            }
            
            await document.destroy();
            
            await ActivityLog.create({
                user_id: req.user.id,
                action: 'DELETE_DOCUMENT',
                details: JSON.stringify({ document_id: id, title: document.title }),
                ip_address: req.ip
            });
            
            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        } catch (error) {
            console.error('Delete document error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting document'
            });
        }
    }
}

module.exports = new DocumentController();