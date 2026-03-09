import express from 'express';
import { getAnnouncements, getAnnouncementById, createAnnouncement, deleteAnnouncement } from '../controllers/announcementController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);

// Only Admins and Faculty can create or delete announcements
router.post('/', requireRole('Admin', 'Super Admin', 'Faculty'), createAnnouncement);
router.delete('/:id', requireRole('Admin', 'Super Admin', 'Faculty'), deleteAnnouncement);

export default router;
