// Widgets section
function widgetsCloud() {

    const widgetItems = document.getElementsByClassName("widgets__item"), // Widget word cloud
    widgets = document.getElementsByClassName("widget"); // Widgets' bodies
    let activeWidgetItem = document.getElementsByClassName("widgets__item_active")[0]; // Active button in the widgets cloud

    if (document.getElementsByClassName("widgets")) {
        
        if (loadWidgetFromHash()) { // Scroll to widget cloud if URL hash set to a widget.
          setTimeout(() => {
              document.getElementsByClassName("widgets")[0].scrollIntoView({
                  behavior: "smooth",
                  block: "nearest"
              }); // Scrolls to the widgets section
          }, 200);
        }
        window.addEventListener('hashchange', loadWidgetFromHash);

        for (let i = 0; i < widgetItems.length; i++) {
            widgetItems[i].addEventListener("click", e => { // Add click event for each widget button in the cloud
                const targetWidget = document.getElementById(e.target.dataset.widgetTarget), // Defines which widget the user is trying to render
                openedWidget = document.getElementsByClassName("widget_open")[0], // Defines the current open widget
                targetWidgetItem = e.target; // Defines the current open widget
                changeWidgets(openedWidget, targetWidget, targetWidgetItem);  // Runs the function to change which widget is displayed              
            })
        }
    }
    function loadWidgetFromHash() {
        if (!window.location.hash) return; // Check if the given URL has a hash to make each widget shareable

        const targetWidget = document.getElementById(window.location.hash.substr(1)), 
        openedWidget = document.getElementsByClassName("widget_open")[0];

        let targetWidgetItem = "";
        for (let i = 0; i < widgetItems.length; i++) {
            if (widgetItems[i].dataset.widgetTarget == window.location.hash.substr(1)) {
                targetWidgetItem = widgetItems[i]
            }
        };
        if (!targetWidgetItem) return; // Make sure the hash pointed to a widget, not something else.

        changeWidgets(openedWidget, targetWidget, targetWidgetItem, true);  // Runs the function to change which widget is displayed
        return true;
    }
    function changeWidgets(active, target, cloudItem, preventHistoryUpdate) {
    
        target.classList.add("widget_opening"); // Starts the process of opening the next widget
    
        active.classList.remove("widget_open"); // Removes the active state of the current widget
        active.classList.add("widget_closing"); // But guarantees the current active widget a closing class for transition purposes
    
        activeWidgetItem.classList.remove("widgets__item_active"); // Removes the active state of the current widget item in the cloud
        activeWidgetItem = cloudItem; // Sets the new active widget item as the clicked one
        activeWidgetItem.classList.add("widgets__item_active"); // And adds the active CSS class to it
    
        if (!preventHistoryUpdate) {
            if (history.pushState) {
                history.pushState(null, null, '#' + cloudItem.dataset.widgetTarget);
            }
            else {
                location.hash = '#' + cloudItem.dataset.widgetTarget;
            }
        }
    
        setTimeout(() => {
            target.classList.remove("widget_opening"); // Removes the opening class to finish transition
            target.classList.add("widget_open"); // Defines the new target widget
            active.classList.remove("widget_closing"); // Finally gets completely rid of the previously openened widget
    
        }, 150) // When the transition is done, finish the process by attributing the final classes to each widget
    }
}


widgetsCloud();
