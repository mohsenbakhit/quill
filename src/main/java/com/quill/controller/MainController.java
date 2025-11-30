package com.quill.controller;

import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.TextArea;

public class MainController {
    @FXML
    private TextArea textArea;


    @FXML
    private void handleExit() {
        System.exit(0);
    }

    @FXML
    private void handleNew() {
        textArea.clear();
    }
}
