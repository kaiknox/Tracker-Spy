$(document).ready(function () {


    $('body').tooltip({
    selector: '[data-toggle="tooltip"]'
});
    setTimeout(function () {
        $(".graph-bar").removeClass("hide");
        $(".graph-bar-hr").removeClass("hide");
    }, 1000)
});