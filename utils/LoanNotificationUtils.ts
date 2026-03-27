
import { supabase } from '../lib/supabaseClient';
import { UserAccount } from '../types';

/**
 * Checks for asset loans that have reached their expected return date
 * and creates notifications for both the user and admin.
 */
export const checkAssetLoanOverdue = async (currentUser: UserAccount | null) => {
    console.log('[DEBUG OVERDUE] Function checkAssetLoanOverdue called.');
    console.log('[DEBUG OVERDUE] Current user:', currentUser?.fullName, 'Role:', currentUser?.role);

    // Only admins or staff should trigger the global overdue check to avoid redundant DB calls and ensure authority
    if (!currentUser) {
        console.log('[DEBUG OVERDUE] NO current user. Exiting.');
        return;
    }

    const roleLower = currentUser.role?.toLowerCase();
    if (roleLower !== 'admin' && roleLower !== 'staff') {
        console.log('[DEBUG OVERDUE] User role is NOT Admin or Staff. Role is:', currentUser.role);
        return;
    }

    // Force run for testing
    console.log('[DEBUG OVERDUE] Conditions met. Starting database fetch...');

    try {
        const now = new Date().toISOString();
        console.log('[DEBUG OVERDUE] Checking for Active loans before:', now);
        
        // 1. Fetch active loans that are past their expected return date
        const { data: overdueLoans, error: fetchError } = await supabase
            .from('it_asset_loans')
            .select(`
                *,
                it_assets (
                    item_name,
                    asset_id
                )
            `)
            .eq('status', 'Active')
            .lt('expected_return_date', now);

        if (fetchError) {
            console.error('[DEBUG OVERDUE] Database fetch Error:', fetchError);
            throw fetchError;
        }

        console.log(`[DEBUG OVERDUE] Found ${overdueLoans?.length || 0} active loans to process.`);

        if (!overdueLoans || overdueLoans.length === 0) {
            console.log('[DEBUG OVERDUE] No active overdue loans found.');
            return;
        }

        for (const loan of overdueLoans) {
            console.log('[DEBUG OVERDUE] Processing loan ID:', loan.loan_id, 'Borrower:', loan.borrower_name);
            
            // 2. Update status to Overdue
            const { error: updateError } = await supabase
                .from('it_asset_loans')
                .update({ status: 'Overdue' })
                .eq('id', loan.id);

            if (updateError) {
                console.error('[DEBUG OVERDUE] Status update FAILED for', loan.loan_id, updateError);
            } else {
                console.log('[DEBUG OVERDUE] Status updated to Overdue for', loan.loan_id);
            }

            // 3. Find borrower email by looking up user_accounts by full_name
            const { data: borrowerAccount } = await supabase
                .from('user_accounts')
                .select('email')
                .eq('full_name', loan.borrower_name)
                .maybeSingle();

            const borrowerEmail = borrowerAccount?.email;
            console.log('[DEBUG OVERDUE] Borrower found in accounts?', !!borrowerEmail, 'Email:', borrowerEmail);

            // 4. Create notification for Borrower
            if (borrowerEmail) {
                const { error: notifError } = await supabase.from('notifications').insert([{
                    user_email: borrowerEmail,
                    title: 'Asset Return Overdue',
                    message: `Reminder: The asset "${loan.it_assets?.item_name || 'Asset'}" (${loan.it_assets?.asset_id || loan.asset_id}) was scheduled to be returned on ${new Date(loan.expected_return_date).toLocaleDateString()}. Please return it as soon as possible.`,
                    type: 'Alert',
                    link: 'asset-loan'
                }]);
                
                if (notifError) console.error('[DEBUG OVERDUE] Borrower notification FAILED:', notifError);
                else console.log('[DEBUG OVERDUE] Borrower notification created.');

                // Trigger email through bridge if possible
                await triggerEmailNotification(borrowerEmail, loan);
            }

            // 5. Create notification for Admin
            const { error: adminNotifError } = await supabase.from('notifications').insert([{
                user_email: currentUser.email,
                title: 'Overdue Asset Warning',
                message: `${loan.borrower_name} is overdue for returning "${loan.it_assets?.item_name || 'Asset'}". Status updated to Overdue.`,
                type: 'Warning',
                link: 'asset-loan'
            }]);

            if (adminNotifError) console.error('[DEBUG OVERDUE] Admin notification FAILED:', adminNotifError);
            else console.log('[DEBUG OVERDUE] Admin notification created for', currentUser.email);
        }
        
    } catch (error) {
        console.error('[DEBUG OVERDUE] Global Error:', error);
    }
};

/**
 * Sends an email notification via Supabase Edge Function.
 */
const triggerEmailNotification = async (email: string, loan: any) => {
    try {
        console.log(`[DEBUG OVERDUE] Invoking Edge Function for: ${email}`);
        
        const { data, error } = await supabase.functions.invoke('send-overdue-alert', {
            body: {
                to: email,
                borrowerName: loan.borrower_name,
                assetName: loan.it_assets?.item_name || 'Equipment',
                dueDate: new Date(loan.expected_return_date).toLocaleDateString()
            }
        });

        if (error) {
            console.error('[DEBUG OVERDUE] Edge Function Error:', error);
        } else {
            console.log('[DEBUG OVERDUE] Edge Function success Response:', data);
        }

    } catch (e) {
        console.error("[DEBUG OVERDUE] Edge Function trigger failed:", e);
    }
};
