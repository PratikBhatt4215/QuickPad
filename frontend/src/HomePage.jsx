import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Generate a random ID (6 characters)
        const uniqueId = Math.random().toString(36).substring(2, 8);
        navigate(`/editor/${uniqueId}`);
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            fontSize: '1.2rem'
        }}>
            Creating your shared editor session...
        </div>
    );
};

export default HomePage;
