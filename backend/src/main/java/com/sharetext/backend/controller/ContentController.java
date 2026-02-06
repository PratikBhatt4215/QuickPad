package com.sharetext.backend.controller;

import com.sharetext.backend.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContentController {
    private final ContentService contentService;

    @GetMapping("/{id}")
    public String getContent(@PathVariable String id) {
        return contentService.getContent(id);
    }
}
