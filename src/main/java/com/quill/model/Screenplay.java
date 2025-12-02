package com.quill.model;

import java.util.List;
import java.util.ArrayList;

public class Screenplay {
    private String title;
    private String author;
    private List<Scene> scenes;

    public Screenplay(String title) {
        this.title = title;
        this.scenes = new ArrayList<>();
    }

    public String getTitle() {return this.title;}
    public void setTitle(String title) {this.title = title;}
    public String getAuthor() {return this.author;}
    public void setAuthor(String author) {this.author = author;}
    public List<Scene> getScenes() {return this.scenes;}
    public void addScene(Scene scene) {this.scenes.add(scene);}
}

