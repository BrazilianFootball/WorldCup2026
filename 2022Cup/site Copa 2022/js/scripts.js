$(document).ready(function () {

    // inicio novo  
    $(".button-mais").click(function () {
        if($(this).hasClass("expand")){       
            $(this).removeClass("expand").addClass("close").text("Mostrar menos").prev().animate({height: $('.menu-table').height()}, 200)
        }else{
           $(this).removeClass("close").addClass("expand").text("Ver ranking completo").prev().animate({height: "277"}, 200); 
        }       
    });
    
});

