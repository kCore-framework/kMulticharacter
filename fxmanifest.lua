fx_version "cerulean"

description "Multicharacter"
author "Kypos"
version '1.0.0'

lua54 'yes'

game "gta5"


ui_page 'web/build/index.html'

shared_script 'config.lua'
client_script "client/**/*"
server_script "server/**/*"

files {
	'web/build/index.html',
	'web/build/**/*',
}