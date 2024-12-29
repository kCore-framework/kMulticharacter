local CharacterSlots = false
local maxSlots = false
previewPeds = {}
local currentCam = nil
local characterHeadshots = {}


local function PlayPedAnimation(ped, position)
    if not position.anim then
        return
    end

    RequestAnimDict(position.anim.dict)
    while not HasAnimDictLoaded(position.anim.dict) do
        Wait(0)
    end

    TaskPlayAnim(ped, position.anim.dict, position.anim.anme, 1000.0, -0.0, -1, 1, 0, false, false, false)
end

local function CreatePreviewPeds()
    for _, ped in pairs(previewPeds) do
        if DoesEntityExist(ped) then
            DeleteEntity(ped)
        end
    end
    previewPeds = {}
    for slot, pos in pairs(Config.characterPositions) do
        local model = 1885233650
        RequestModel(model)
        while not HasModelLoaded(model) do
            Wait(0)
        end

        local ped = CreatePed(-1, model, pos.coords.x, pos.coords.y, pos.coords.z, pos.coords.w, false, true)
        if ped then
            SetEntityInvincible(ped, true)
            FreezeEntityPosition(ped, true)
            SetBlockingOfNonTemporaryEvents(ped, true)
            SetEntityAlpha(ped, 150, false)
            PlayPedAnimation(ped, pos)
            local appearance = exports['kClothing']:GenerateRandomAppearance(ped)
            previewPeds[slot] = ped
        end
    end
end

local function GetPedHeadshot(ped)
    if characterHeadshots[ped] then
        UnregisterPedheadshot(characterHeadshots[ped].id)
        characterHeadshots[ped] = nil
    end

    local headshot = RegisterPedheadshot(ped)
    local timeout = 20 -- safty chek

    while timeout > 0 and not IsPedheadshotReady(headshot) do
        timeout = timeout - 1
        Wait(200)
    end

    if timeout > 0 and IsPedheadshotValid(headshot) then
        local txd = GetPedheadshotTxdString(headshot)
        characterHeadshots[ped] = {
            id = headshot,
            txd = txd
        }
        return txd
    else
        if IsPedheadshotValid(headshot) then
            UnregisterPedheadshot(headshot)
        end
        return nil
    end
end

local function UpdatePreviewPed(slot, charData, previewData)
    if previewPeds[slot] and DoesEntityExist(previewPeds[slot]) then
        DeleteEntity(previewPeds[slot])
        previewPeds[slot] = nil
    end

    local pos = Config.characterPositions[slot]
    if not pos then
        print("No position data for slot", slot)
        return
    end

    local model
    if charData and charData and charData.Appearance then
        model = charData.Appearance.model
        print("Using existing character model:", model)
    elseif previewData then
        model = previewData.sex == 'female' and -1667301416 or 1885233650
        print("Using preview model:", model)
    else
        model = 1885233650
        print("Using default male model")
    end

    if not HasModelLoaded(model) then
        RequestModel(model)
        while not HasModelLoaded(model) do
            Wait(0)
        end
    end

    local ped = CreatePed(-1, model, pos.coords.x, pos.coords.y, pos.coords.z, pos.coords.w, false, true)
    if not ped then
        print("Failed to create preview ped")
        return
    end
    local appearance = exports['kClothing']:GenerateRandomAppearance(ped)

    SetEntityInvincible(ped, true)
    FreezeEntityPosition(ped, true)
    SetEntityHeading(ped, pos.coords.w)
    SetBlockingOfNonTemporaryEvents(ped, true)
    PlayPedAnimation(ped, pos)
    previewPeds[slot] = ped

    local needsNewHeadshot = false

    if charData and charData and charData.Appearance then
        local appearance = charData.Appearance
        print(json.encode(appearance))
        if appearance then
            exports['kClothing']:ApplyAppearance(appearance, ped)
            needsNewHeadshot = true
        end
    elseif previewData then
        local defaultAppearance = {
            model = model,
            genetics = {
                mother = 21,
                father = 0,
                shapeMix = 0.5,
                skinMix = 0.5
            },
            clothing = {},
            faceFeatures = {},
            headOverlays = {}
        }
        exports['kClothing']:ApplyAppearance(defaultAppearance, ped)
        needsNewHeadshot = true
    end

    if needsNewHeadshot then
        CreateThread(function()
            Wait(100)
            local txd = GetPedHeadshot(ped)
            if txd then
                SendReactMessage('updateCharacterHeadshot', {
                    slot = slot,
                    texture = txd
                })
            end
        end)
    end
end


RegisterNUICallback('previewCharacter', function(data, cb)
    if data.createMode then

        if data.slot then
            UpdatePreviewPed(data.slot, nil, {
                sex = data.sex or 'male'
            })
            exports['kMulticharacter']:HandlePreviewCamera(data.slot, true)
        end
    else
        if data.slot then
            exports['kMulticharacter']:HandlePreviewCamera(data.slot, true)
        else
            exports['kMulticharacter']:HandlePreviewCamera(nil, false)
        end
    end
    
    cb({})
end)

local function toggleNuiFrame(shouldShow)
    SetNuiFocus(shouldShow, shouldShow)
    SendReactMessage('setVisible', shouldShow)

    DisplayRadar(false)

    local playerPed = PlayerPedId()
    local interior = GetInteriorAtCoords(Config.defaultPos)
    LoadInterior(interior)
    while not IsInteriorReady(interior) do
        Wait(100)
    end
    FreezeEntityPosition(playerPed, true)
    SetEntityCoords(playerPed, Config.defaultPos)

    if shouldShow then
        CreatePreviewPeds()
        if CharacterSlots then
            for slot, charData in pairs(CharacterSlots) do
                if charData then
                    UpdatePreviewPed(slot, charData)
                end
            end
        end
    else
        exports['kMulticharacter']:HandlePreviewCamera(nil, false)
        for _, ped in pairs(previewPeds) do
            if DoesEntityExist(ped) then
                DeleteEntity(ped)
            end
        end
        previewPeds = {}
    end
end

RegisterCommand('campos', function()
    print(GetGameplayCamCoord(), GetGameplayCamRot())
end)

CreateThread(function()
    while true do
        Wait(0)
        if NetworkIsSessionStarted() then
            local ped = PlayerPedId()
            local chars = exports['kCore']:TriggerServerCallback('kCore:getCharacterSlots', function(response)
                CharacterSlots = response.characters
                if response.maxSlots <= 1 and response.autoload and response.characters[1] then
                    TriggerServerEvent('kCore:selectCharacter', 1)
                    toggleNuiFrame(false)
                    SetEntityCoords(ped, -131.6913, 558.3939, 160.0)
                else
                    toggleNuiFrame(true)
                end
            end)
            break
        end
    end
end)

RegisterNUICallback('getCharacterSlots', function(data, cb)

    while not CharacterSlots do
        Wait(0)
    end
    cb({
        characters = CharacterSlots,
        maxSlots = maxSlots
    })
end)

RegisterNUICallback('selectCharacter', function(data, cb)
    if not data.slot then
        cb({
            error = "No slot provided"
        })
        return
    end

    if data.preview then
        exports['kMulticharacter']:HandlePreviewCamera(data.slot, true)
        cb({})
        return
    end
    StopCameraCycle() 
    exports['kMulticharacter']:HandlePreviewCamera(nil, false) 
    
    TriggerServerEvent('kCore:selectCharacter', data.slot)
    toggleNuiFrame(false)
    
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, false)
    SetEntityVisible(playerPed, true, true)
    
    DoScreenFadeIn(1000)
    
    cb({})
end)


RegisterNUICallback('createCharacter', function(data, cb)
    local ped = PlayerPedId()
    SetEntityVisible(ped, true, true)
    FreezeEntityPosition(ped, false)
    if not data.slot or not data.firstName or not data.lastName then
        cb({
            error = "Missing required fields"
        })
        return
    end

    TriggerServerEvent('kCore:createCharacter', data.slot, {
        firstName = data.firstName,
        lastName = data.lastName,
        sex = data.sex,
        height = data.height,
        birthday = data.birthday
    })

    toggleNuiFrame(false)
    cb({})
end)

RegisterNetEvent('kCore:loadPlayer')
AddEventHandler('kCore:loadPlayer', function(playerData, isNew)
    FreezeEntityPosition(PlayerPedId(), false)
    print("Character loaded", json.encode(playerData))
end)

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then
        return
    end

    for _, ped in pairs(previewPeds) do
        if DoesEntityExist(ped) then
            DeleteEntity(ped)
        end
    end

    for _, headshot in pairs(characterHeadshots) do
        if headshot.id then
            UnregisterPedheadshot(headshot.id)
        end
    end

    if currentCam then
        SetCamActive(currentCam, false)
        RenderScriptCams(false, false, 0, true, true)
        DestroyCam(currentCam, true)
    end
end)
