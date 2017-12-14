// Widgets section
function widgetsCloud() {
    if ($('.widgets')) {
        const widgetItems = document.getElementsByClassName("widgets__item"), // Widget word cloud
            widgets = document.getElementsByClassName("widget"), // Widgets' bodies
            widgetBackground = document.getElementsByClassName("widgets__background")[0]; // Widget container flexible height background

        let activeWidgetItem = document.getElementsByClassName("widgets__item_active")[0];

        for (let i = 0; i < widgetItems.length; i++) {
            widgetItems[i].addEventListener("click", e => { // Add click event for each widget button in the cloud
                const targetWidget = document.getElementById(e.target.dataset.widgetTarget), // Defines which widget the user is trying to render
                    openedWidget = document.getElementsByClassName("widget_open")[0]; // Defines the current open widget

                targetWidget.classList.add("widget_opening"); // Starts the process of opening the next widget
                widgetBackground.style.height = targetWidget.offsetHeight + "px"; // Changes the widgets container background's height in order for a smoother transition between sections

                openedWidget.classList.remove("widget_open"); // Removes the active state of the current widget
                openedWidget.classList.add("widget_closing"); // But guarantees the current active widget a closing class for transition purposes

                activeWidgetItem.classList.remove("widgets__item_active"); // Removes the active state of the current widget item in the cloud
                activeWidgetItem = e.target; // Sets the new active widget item as the clicked one
                activeWidgetItem.classList.add("widgets__item_active"); // And adds the active CSS class to it


                setTimeout(() => {
                    targetWidget.classList.remove("widget_opening"); // Removes the opening class to finish transition
                    targetWidget.classList.add("widget_open"); // Defines the new target widget
                    openedWidget.classList.remove("widget_closing"); // Finally gets completely rid of the previously openened widget

                }, 150) // When the transition is done, finish the process by attributing the final classes to each widget
            })
        }
    }
}

widgetsCloud();