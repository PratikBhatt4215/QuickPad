package com.sharetext.backend.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ContentService {
    private final Map<String, String> sessionContent = new ConcurrentHashMap<>();

    public String getContent(String id) {
        return sessionContent.getOrDefault(id, "");
    }

    public void updateContent(String id, String content) {
        sessionContent.put(id, content);
    }
}
