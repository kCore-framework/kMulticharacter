
exports['kCore']:RegisterServerCallback('kCore:getCharacterSlots', function(source, cb)
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then 
        cb(false, "No identifier found")
        return 
    end
    
    exports['kCore']:GetCharacterSlots(identifier, function(data)
        cb(data)
    end)
end)

RegisterServerEvent('kCore:createCharacter')
AddEventHandler('kCore:createCharacter', function(slot, data)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then 
        TriggerClientEvent('kCore:characterCreated', source, false, "No identifier found")
        return 
    end
    exports['kCore']:CreateCharacter(identifier, slot, data, source, function(success, result)
        if success then
            TriggerClientEvent('kCore:characterCreated', source, true)
        else
            TriggerClientEvent('kCore:characterCreated', source, false, result)
        end
    end)
end)

RegisterServerEvent('kCore:selectCharacter')
AddEventHandler('kCore:selectCharacter', function(slot)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then 
        print("^1Error: No identifier found for source^7:", source)
        return 
    end
    
    exports['kCore']:SelectCharacter(identifier, slot, source, function(success)
        if not success then
            print("^1Error: Failed to select character for source^7:", source)
        end
    end)
end)