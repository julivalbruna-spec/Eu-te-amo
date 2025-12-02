
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';

let sessionId: string | null = null;

const getSessionId = (): string => {
    if (sessionId) return sessionId;

    const existingId = localStorage.getItem('analytics_session_id');
    if (existingId) {
        sessionId = existingId;
        return existingId;
    }

    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('analytics_session_id', newId);
    sessionId = newId;
    return newId;
};

export const logEvent = (eventName: string, payload: object = {}, storeId?: string) => {
    try {
        const eventData = {
            sessionId: getSessionId(),
            eventName,
            payload,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            url: window.location.href,
        };

        if (storeId) {
            db.collection('stores').doc(storeId).collection('analytics_events').add(eventData);
        } else {
            // Fallback for legacy/global events
            db.collection('analytics_events').add(eventData);
        }
    } catch (error) {
        console.error("Error logging analytics event:", error);
    }
};

const isOutsideBusinessHours = (siteInfo: any, checkTime: Date): boolean => {
    const hoursWeek = siteInfo?.hoursWeek || "08:00 - 18:00";
    const hoursSaturday = siteInfo?.hoursSaturday || "08:00 - 13:00";
    const day = checkTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    let hoursRange;
    if (day === 0) return true; // Sunday is always outside
    if (day === 6) hoursRange = hoursSaturday; // Saturday
    else hoursRange = hoursWeek; // Weekday

    const [startStr, endStr] = hoursRange.replace(/[^0-9:-]/g, '').split('-');
    if (!startStr || !endStr) return false; // Invalid format

    const [startHour, startMin] = startStr.split(':').map(Number);
    const [endHour, endMin] = endStr.split(':').map(Number);

    const checkHour = checkTime.getHours();
    const checkMin = checkTime.getMinutes();
    
    const startTimeInMinutes = startHour * 60 + startMin;
    const endTimeInMinutes = endHour * 60 + endMin;
    const checkTimeInMinutes = checkHour * 60 + checkMin;

    return checkTimeInMinutes < startTimeInMinutes || checkTimeInMinutes > endTimeInMinutes;
};


export const logAuditEvent = async (action: string, details: object = {}, storeId?: string) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.warn("Audit event triggered without authenticated user.");
            return;
        }

        let siteInfo = {};
        const now = new Date();

        if (storeId) {
             const siteInfoDoc = await db.collection('stores').doc(storeId).collection('settings').doc('siteInfo').get();
             siteInfo = siteInfoDoc.exists ? siteInfoDoc.data() || {} : {};
        } else {
             // Fallback legacy check
             const siteInfoDoc = await db.collection('settings').doc('siteInfo').get();
             siteInfo = siteInfoDoc.exists ? siteInfoDoc.data() || {} : {};
        }

        const logData = {
            user: user.email || user.uid,
            action,
            details,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isOutsideBusinessHours: isOutsideBusinessHours(siteInfo, now),
        };

        if (storeId) {
            await db.collection('stores').doc(storeId).collection('audit_logs').add(logData);
        } else {
            await db.collection('audit_logs').add(logData);
        }

    } catch (error) {
        console.error("Error logging audit event:", error);
    }
};
