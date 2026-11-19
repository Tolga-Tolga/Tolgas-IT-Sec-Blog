+++
title = '{{ replace (replaceRE "_[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$" "" .File.ContentBaseName) "-" " " | title }}'
date = {{ .Date }}
description = ''
tags = []
draft = true
+++
