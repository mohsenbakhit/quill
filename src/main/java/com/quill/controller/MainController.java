package com.quill.controller;

import com.quill.model.Screenplay;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.TextArea;

public class MainController {
    Screenplay currentScreenplay;
    @FXML
    private TextArea textArea;

    @FXML
    private TextArea previewArea;

    @FXML
    public void initialize() {
        currentScreenplay = new Screenplay("New Screenplay");

    }


    @FXML
    private void handleExit() {
        System.exit(0);
    }

    @FXML
    private void handleNew() {
        textArea.clear();
    }

}
