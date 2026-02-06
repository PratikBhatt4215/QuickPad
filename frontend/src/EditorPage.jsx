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
        };

        const handleClear = () => {
            const confirmClear = window.confirm("Are you sure you want to clear all content?");
            if (confirmClear) {
                handleEditorChange('');
            }
        };

        const handlePaste = async (e) => {
            const items = e.clipboardData.items;
            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    const formData = new FormData();
                    formData.append('file', blob);

                    try {
                        const response = await fetch(`${getApiUrl().replace('/content', '/images')}`, {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            const imageId = await response.text();
                            // Get URL for the image
                            const imageUrl = `${getApiUrl().replace('/content', '/images')}/${imageId}`;
                            // Insert markdown at cursor
                            const imageMarkdown = `\n![Shared Image](${imageUrl})\n`;

                            // Simple append for now
                            handleEditorChange(content + imageMarkdown);
                        }
                    } catch (error) {
                        console.error("Error uploading image:", error);
                        alert("Failed to upload image.");
                    }
                }
            }
        };

        return (
            <>
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '10px'
                }}>
                    <button
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#e53935',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            fontSize: '14px',
                            fontFamily: 'inherit'
                        }}
                        onClick={handleClear}
                    >
                        Clear
                    </button>
                    <button
                        style={{
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
                </div>
                <div onPaste={handlePaste} style={{ width: '100%', height: '100%' }}>
                    <Editor
                        height="100vh"
                        width="100vw"
                        defaultLanguage="markdown"
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
                </div>
            </>
        );
    };

    export default EditorPage;
