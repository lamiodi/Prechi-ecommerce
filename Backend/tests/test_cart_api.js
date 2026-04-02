import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/cart/1', {
            headers: { 'x-user-country': 'Nigeria' }
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        if (e.response) {
            console.error('Status:', e.response.status, e.response.data);
        } else {
            console.error(e.message);
        }
    } finally {
        process.exit(0);
    }
}
test();
