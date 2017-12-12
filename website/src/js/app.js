// Sticky Nav Functionality in Vanilla JS

var header = $("#header");

if ($('.landing.page, .community.page').length) {
  window.onscroll = function() {

    var currentWindowPos = document.documentElement.scrollTop || document.body.scrollTop;

    if (currentWindowPos > 0) {
      header.addClass('scrolled');
    } else {
      header.removeClass('scrolled');
    }
  };
}

// Auto Indexing Docs Nav

var indexDocsSubsections = function() {
  if ($('.docs.page').length) {

    if ($('#docs-content h2').length > 1) {
      $('<ul class="nav-subsections" id="nav-subsections"></ul>').insertAfter($('#docs-nav .nav-link.active'));

      $('#docs-content h2').each(function() {
        var sectionTitle = $(this).html(),
          anchor     = $(this).attr("id");

        $('#nav-subsections').append('<li><a class="subnav-link for-' + anchor + '" href="#' + anchor + '">' + sectionTitle + '</a></li>');

      });

      $.localScroll({
        offset: -120,
        duration:200,
        hash:true
      });
    }

    $(window).on('scroll', function(){
      window.requestAnimationFrame(scrollHandler);

      function scrollHandler() {
        var scrollTop      = $(window).scrollTop(),
          windowHeight   = $(window).height(),
          first        = false,
          allSubnavLinks = $("#docs-nav .subnav-link");

        $("#docs-content h2").each( function() {
          var offset   = $(this).offset(),
            thisLink = '.for-' + $(this).attr("id");

          if (scrollTop <= offset.top && ($(this).height() + offset.top) < (scrollTop + windowHeight) && first == false) {
            allSubnavLinks.removeClass('active');
            $(thisLink).addClass('active');
            first=true;
          } else {
            first=false;
          }
        });
      }
    });
  }
}

indexDocsSubsections();

var docsMobileMenu = function() {
  if ($('.docs.page').length) {

    $("#mobile-docs-nav").change(function() {
      window.location = $(this).find("option:selected").val();
    });
  }
}

docsMobileMenu();

// search
$('#search-button').click(function() {
  console.log("clicked")
  $('.search-icon').toggleClass('active');
  $('.algolia-search').toggleClass('closed');
});


// eventbrite info
var eventInfoLoad = function() {
  if ($('.community.page').length) {
    var eventRequest = new XMLHttpRequest;
    var eventbriteToken = 'C5PX65CJBVIXWWLNFKLO';
    var eventbriteOrganiser = '14281996019';
    eventRequest.open('GET', 'https://www.eventbriteapi.com/v3/events/search/?token=' + eventbriteToken + '&organizer.id=' + eventbriteOrganiser + '&expand=venue%27', true);

    eventRequest.onload = function() {
      if (eventRequest.status >= 200 && eventRequest.status < 400) {
        // Success!
        var data = JSON.parse(eventRequest.responseText);
        var upcomingDate = data.events[0].start.utc;
        updateDate(upcomingDate);
      } else {
        var upcomingDate = "0000-00-00T00:00:00Z";
        updateDate(upcomingDate);
      }

    };

    eventRequest.onerror = function() {
       alert('The event info could not be loaded at this time, please try again later.');
    };

    function updateDate(eventDate) {
      $('.month').append(moment(eventDate).format('MMMM'));
      $('.day').append(moment(eventDate).format('DD'));
      $('.calendar-cta h2 strong:first-child()').append(moment(eventDate).format('dddd, MMMM Do'));
      $('.calendar-cta h2 strong:last-child()').append(moment(eventDate).utcOffset(-7).format('h a'));
    }

    eventRequest.send();
  }
}

eventInfoLoad();

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