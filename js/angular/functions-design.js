function addmenu(event)
{
    var menu=$(event.target).find('.menu');
    var str=$(event.target).attr('class');
    str=str.match( /typecmd.*/i )[0];
    var apply=(str.match('ann')) ? 'ctg' : (str.match('val')) ? 'ssctg' : 'plats' ;

    menu.find('.menu-open').remove();
    menu.find('a.menu-item').remove();
    menu.prepend('<input type="checkbox" href="#" class="menu-open .menu-item-'+apply+'" name="menu-open" id="menu-open"/>');
    var edit=$('<a/>').addClass('menu-item');
    var icon_edit=$('<i/>').addClass('fa fa-edit');
    edit.append(icon_edit);
    var details=$('<a/>').addClass('menu-item');
    var icon_details=$('<i/>').addClass('fa fa-eye');
    details.append(icon_details);
    var remove=$('<a/>').addClass('menu-item');
    var icon_remove=$('<i/>').addClass('fa fa-trash-o');
    remove.append(icon_remove);
    menu.append(edit);menu.append(details);menu.append(remove);
    menu.find('.menu-item').addClass('menu-item-'+apply);
    menu.append('<input type="checkbox" href="#" class="menu-open" name="menu-open" id="menu-open"/>');
}

function removemenu(event)
{
    var menu=$(event.target).find('.menu');
    menu.find('.menu-open').remove();
    menu.find('a.menu-item').remove();
}

$(function () {


});