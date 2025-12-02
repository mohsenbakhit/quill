package com.quill.model;

public class ScreenElement {
    private ScreenplayElementType type;
    private String content;

    public ScreenElement(ScreenplayElementType type, String content) {
        this.type = type;
        this.content = content;
    }

    public ScreenplayElementType getType() {return this.type;}
    public String getContent() {return this.content;}
    public void setType(ScreenplayElementType type) {this.type = type;}
    public void setContent(String content) {this.content = content;}


}
