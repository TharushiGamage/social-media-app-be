
async function testGetAllPosts() {
    try {
        const response = await fetch('http://localhost:8800/api/posts');
        console.log('Status Code:', response.status);
        if (response.status === 200) {
            const data = await response.json();
            console.log('Success! Retrieved', data.length, 'posts.');
        } else {
            console.log('Failed checking status code');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testGetAllPosts();
