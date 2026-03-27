// Native fetch is available in Node 18+

async function testEmail() {
    try {
        const response = await fetch('http://localhost:5000/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Verification',
                hostelNumber: 'VB1',
                roomNumber: 'TestRoom',
                description: 'This is a verification email from the AI agent.',
                email: 'jk8523301@gmail.com'
            })
        });

        const data = await response.json();
        console.log('Status Code:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testEmail();
