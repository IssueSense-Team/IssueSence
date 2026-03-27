import fetch from 'node-fetch'; // Keeping import for consistency, but using native fetch logic below if needed or just use fetch
import fetch from 'node-fetch'; // Keeping import for consistency, but using native fetch logic below if needed or just use fetch
const nativeFetch = globalThis.fetch;

async function verifyWardenFlow() {
    // 1. Submit Issue for Hostel H1
    console.log('Submitting issue for Hostel H1...');
    const submitRes = await nativeFetch('http://localhost:5000/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Student A',
            hostelNumber: 'H1',
            roomNumber: '101',
            description: 'Fan broken'
            // userId removed to avoid CastError
        })
    });
    const submitData = await submitRes.json();
    console.log('Submission Result:', submitData);

    if (!submitData.issueId) {
        console.error('Issue submission failed');
        return;
    }

    // 2. Fetch notifications for the Warden
    const wardenId = '69411f2069004f9b7de6d2daf';
    console.log(`Fetching notifications for Warden ID: ${wardenId}...`);

    const notifRes = await nativeFetch(`http://localhost:5000/api/notifications?userId=${wardenId}`);
    const notifications = await notifRes.json();

    console.log('Warden Notifications:', JSON.stringify(notifications, null, 2));

    if (notifications.length > 0 && notifications[0].title.includes('New Issue')) {
        console.log('✅ SUCCESS: Warden received in-app notification!');
    } else {
        console.error('❌ FAILURE: No notification found for warden.');
    }
}

verifyWardenFlow();
