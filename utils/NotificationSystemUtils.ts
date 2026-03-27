
import { supabase } from '../lib/supabaseClient';

/**
 * Sends a notification to all users with Admin, Super Admin, or Staff roles.
 */
export const sendNotificationToAdmins = async (
    title: string, 
    message: string, 
    type: 'Info' | 'Success' | 'Warning' | 'Alert' = 'Info', 
    link?: string
) => {
    try {
        // 1. Fetch all users who should receive admin-level notifications
        const { data: allUsers, error: fetchError } = await supabase
            .from('user_accounts')
            .select('email, role');

        if (fetchError) {
            console.error('[NotificationSystem] Error fetching admins:', fetchError);
            return;
        }

        const admins = allUsers?.filter(u => {
            const r = u.role?.toLowerCase();
            return r === 'admin' || r === 'super admin' || r === 'staff';
        });

        if (fetchError) {
            console.error('[NotificationSystem] Error fetching admins:', fetchError);
            return;
        }

        if (!admins || admins.length === 0) {
            console.warn('[NotificationSystem] No admins found to notify.');
            return;
        }

        // 2. Prepare notification records for all admins
        // Filter out duplicate emails just in case
        const uniqueEmails = [...new Set(admins.map(a => a.email.toLowerCase()))];
        
        const notifications = uniqueEmails.map(email => ({
            user_email: email,
            title,
            message,
            type,
            link,
            is_read: false,
            created_at: new Date().toISOString()
        }));

        // 3. Batch insert notifications
        const { error: insertError } = await supabase
            .from('notifications')
            .insert(notifications);

        if (insertError) {
            console.error('[NotificationSystem] Error inserting notifications:', insertError);
        } else {
            console.log(`[NotificationSystem] Successfully notified ${uniqueEmails.length} admins.`);
        }
    } catch (err) {
        console.error('[NotificationSystem] Critical error:', err);
    }
};
