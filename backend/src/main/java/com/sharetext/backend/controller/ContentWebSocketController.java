package com.sharetext.backend.controller;

import com.sharetext.backend.model.ContentModel;
import com.sharetext.backend.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContentWebSocketController {
    private final ContentService contentService;

    @MessageMapping("/content/{id}")
    @SendTo("/topic/content/{id}")
    public ContentModel updateContent(@DestinationVariable String id, ContentModel content) {
        contentService.updateContent(id, content.getContent());
        return content;
    }
}
