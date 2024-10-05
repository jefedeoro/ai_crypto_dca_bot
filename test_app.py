# test_app.py

import unittest
from app import app

class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_home(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)

    def test_getnews(self):
        response = self.app.post('/webhook', json={
            'message': {
                'chat': {'id': 'test_chat_id'},
                'text': '/getnews'
            }
        })
        self.assertEqual(response.status_code, 200)

if __name__ == '__main__':
    unittest.main()
