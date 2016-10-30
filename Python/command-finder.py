import os, re, time, json, pathlib, zipfile

# possible output types:
# plain
# json
output_type = 'plain'

path = pathlib.PurePath(os.getcwd())

if 'Add-Ons' in os.listdir():
    addon_path = path / 'Add-Ons'
else:
    addon_path = path

regex = re.compile(b'\s*function serverCmd([\w\d]+)\s*\(([%\w\d,\s]+)*\)', re.I)
results = {}


start = time.clock()

addon_list = [f for f in os.listdir(str(addon_path)) if f[-3:] == 'zip']

for zip_file_name in addon_list:
    zip = zipfile.ZipFile(str(addon_path / zip_file_name))
    file_list = zip.namelist()
    results[zip_file_name[:-4]] = {}
    for file_name in file_list:
        if file_name[-2:] == 'cs':
            file = zip.open(file_name)
            results[zip_file_name[:-4]][file_name[:-3]] = {}
            for line in file:
                match = regex.match(line)
                if match:
                    results[zip_file_name[:-4]][file_name[:-3]][match.group(1).decode()] = [m.strip() for m in match.group(2).decode().split(',')]
            if not results[zip_file_name[:-4]][file_name[:-3]]:
                del results[zip_file_name[:-4]][file_name[:-3]]
            file.close()
    if not results[zip_file_name[:-4]]:
        del results[zip_file_name[:-4]]
    zip.close()

end = time.clock()


if output_type == 'plain':
    output_file_name = 'server_commands.txt'
    server_cmd_pl = open(output_file_name, 'w+')
    for addon, script_list in sorted(results.items()):
        if server_cmd_pl.tell() != 0:
            server_cmd_pl.write('\n{0}\n'.format(addon))
        else:
            server_cmd_pl.write('{0}\n'.format(addon))
        for script in script_list.values():
            for command in sorted(script.keys()):
                server_cmd_pl.write('    {0}\n'.format(command))
    server_cmd_pl.close()
else:
    output_file_name = 'server_commands.json'
    serv_cmd_json = open(output_file_name, 'w+')
    json.dump(results, serv_cmd_json, sort_keys=True, indent=4)
    serv_cmd_json.close()

print('Results can be found in {0}.'.format(output_file_name))
print('Time taken: {0}'.format(end - start))
input('Press enter to exit.')
