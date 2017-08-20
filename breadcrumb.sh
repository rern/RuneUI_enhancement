# library browsing
sed -i -e $'/(\'#open-panel-sx\').hasClass/{n
s|^|//|
a\
                renderLibraryHome()
}
' -e $'/Genres\/\' + path/{n;n;n
s|^|//|
a\
        var folderSlash = folderHref = "";\
        var folder = path.split("/");\
        for (i = 0; i < folder.length; i++) \{\
            folderSlash += (i == 0) ? "" : "/";\
            folderSlash += folder[i].replace("'", "\\\\'");  // escapes single quote in getDB param\
            folderHref += (i == 0) ? "" : " / ";\
            folderHref += "<a href='"'"'javascript:getDB(\{path : \\""+ folderSlash +"\\"\});'"'"'>"+ folder[i] +"</a>";\
        \}\
        breadcrumb.html(folderHref);
}
' $runeui
