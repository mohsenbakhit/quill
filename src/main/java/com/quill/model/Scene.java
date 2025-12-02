package com.quill.model;

import java.util.List;
import java.util.ArrayList;

public class Scene {
    private String heading;
    private List<ScreenElement>  elements;


    public Scene(String heading) {
        this.heading = heading;
        this.elements = new ArrayList<>();
    }

    public String getHeading() {return this.heading;}
    public void setHeading(String heading) {this.heading = heading;}
    public List<ScreenElement> getElements() {return this.elements;}
    public void addElement( ScreenElement elements) {this.elements.add(elements);}
}
