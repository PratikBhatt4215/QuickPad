import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router-dom';
import { Client } from '@stomp/stompjs';

const EditorPage = () => {
    const { id } = useParams();
    const [content, setContent] = useState('// Start coding or pasting text here...');
    const stompClientRef = useRef(null);
    const userIdRef = useRef(Math.random().toString(36).substring(2, 9));
    const isRemoteUpdate = useRef(false);

    // URL Configuration
    // Use environment variables or fallback to localhost
    const getApiUrl = () => {
        return import.meta.env.VITE_API_URL || 'http://localhost:8080/api/content';
    };

    const getWsUrl = () => {
        return import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    };

    useEffect(() => {
        // Fetch initial content
        fetch(`${getApiUrl()}/${id}`)
            .then(res => res.text())
            .then(text => {
                if (text) {
                    setContent(text);
                }
            })
            .catch(err => console.error("Error fetching content:", err));

        // Setup WebSocket
        const client = new Client({
            brokerURL: getWsUrl(),
            onConnect: () => {
                console.log('Connected to WebSocket');
                client.subscribe(`/topic/content/${id}`, (message) => {
                    try {
                        const body = JSON.parse(message.body);
                        // Only update if it's from a different user
                        if (body.senderId !== userIdRef.current) {
                            isRemoteUpdate.current = true;
                            setContent(body.content);
                        }
                    } catch (e) {
                        console.error("Error parsing message", e);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, [id]);

    const handleEditorChange = (value) => {
        if (isRemoteUpdate.current) {
            isRemoteUpdate.current = false;
            return;
        }

        setContent(value);

        if (stompClientRef.current && stompClientRef.current.connected) {
            stompClientRef.current.publish({
                destination: `/app/content/${id}`,
                body: JSON.stringify({
                    content: value,
                    senderId: userIdRef.current
                }),
            });
        }
    };

    return (
        <>
            <button
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    padding: '10px 20px',
                    backgroundColor: '#007acc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                }}
                onClick={() => window.open('/', '_blank')}
            >
                + New File
            </button>
            <Editor
                height="100vh"
                width="100vw"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={content}
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: true },
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 10 }
                }}
            />
        </>
    );
};

export default EditorPage;
