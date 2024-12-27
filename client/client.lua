local CharacterSlots = false
local maxSlots = false
local previewPeds = {}
local currentCam = nil
local characterHeadshots = {}

local characterPositions = {
    [1] = {
        coords = vec4(-131.6913, 558.3939, 194.9952, 0.7045),
        camPos = {
            coords = vec3(-131.650635, 561.589355, 196.331726),
            rot = vec3(-2.404815, 0.000000, 179.539108),
            fov = 50.0  
        }
    },
    [2] = {
        coords = vec4(-133.8127, 558.3948, 194.9952, 2.7517),
        camPos = {
          coords = vec3(-133.942078, 561.650146, 196.325363),
          rot = 	vec3(-2.776617, 0.000000, -179.437973),
          fov = 50.0  
        }
    },
    [3] = {
        coords = vec4(-135.8896, 558.4208, 194.9952, 4.8521),
        camPos = {
          coords = vec3(-136.000961, 561.653564, 196.324142),
          rot = vec3(-2.742815, -0.000000, 179.672531),
          fov = 50.0  
        }
    }
}

local function CreatePreviewPeds()
    for _, ped in pairs(previewPeds) do
        if DoesEntityExist(ped) then
            DeleteEntity(ped)
        end
    end
    previewPeds = {}
    for slot, pos in pairs(characterPositions) do
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
    local timeout = 20  --safty chek
    
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

    local pos = characterPositions[slot]
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
    
    SetEntityInvincible(ped, true)
    FreezeEntityPosition(ped, true)
    SetEntityHeading(ped, pos.coords.w)
    SetBlockingOfNonTemporaryEvents(ped, true)
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

local function HandlePreviewCamera(slot, active)
  if active and characterPositions[slot] then
      local camData = characterPositions[slot].camPos
      local ped = previewPeds[slot]
      if DoesEntityExist(ped) then
        for previewSlot, previewPed in pairs(previewPeds) do
            if DoesEntityExist(previewPed) then
                SetEntityAlpha(previewPed, previewSlot == slot and 255 or 200, false)
            end
        end
    end
      if not currentCam then
          currentCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
          
          local pedHeight = GetEntityHeight(ped, true)
          local camPos = vec3(
              camData.coords.x,
              camData.coords.y,
              camData.coords.z + (pedHeight * 0.1) 
          )
          
          SetCamCoord(currentCam, camPos.x, camPos.y, camPos.z)
          SetCamRot(currentCam, camData.rot.x, camData.rot.y, camData.rot.z, 2)
          SetCamFov(currentCam, camData.fov)

          local pedCoords = GetEntityCoords(ped)
          local pedBoneIndex = GetPedBoneIndex(ped, 31086)
          if pedBoneIndex ~= -1 then
              local boneCoords = GetPedBoneCoords(ped, pedBoneIndex)
              PointCamAtCoord(currentCam, boneCoords.x, boneCoords.y, boneCoords.z)
          end
          
          SetCamActive(currentCam, true)
          RenderScriptCams(true, true, 1000, true, true)
      else
          local newCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
          
          local pedHeight = GetEntityHeight(ped, true)
          local camPos = vec3(
              camData.coords.x,
              camData.coords.y,
              camData.coords.z + (pedHeight * 0.1)
          )
          
          SetCamCoord(newCam, camPos.x, camPos.y, camPos.z)
          SetCamRot(newCam, camData.rot.x, camData.rot.y, camData.rot.z, 2)
          SetCamFov(newCam, camData.fov)
          
          local pedBoneIndex = GetPedBoneIndex(ped, 31086)
          if pedBoneIndex ~= -1 then
              local boneCoords = GetPedBoneCoords(ped, pedBoneIndex)
              PointCamAtCoord(newCam, boneCoords.x, boneCoords.y, boneCoords.z)
          end
          
          SetCamActiveWithInterp(newCam, currentCam, 1000)
          
          Wait(1000)
          DestroyCam(currentCam, false)
          currentCam = newCam
      end

    
  else
      if currentCam then
          RenderScriptCams(false, true, 1000, true, true)
          Wait(1000)
          DestroyCam(currentCam, true)
          currentCam = nil
      end

      for _, ped in pairs(previewPeds) do
          if DoesEntityExist(ped) then
              SetEntityAlpha(ped, 255, false)
          end
      end
  end
end



RegisterNUICallback('previewCharacter', function(data, cb)
  if not data.slot then
      cb({ error = "No slot provided" })
      return
  end

  if data.createMode then
      UpdatePreviewPed(data.slot, nil, {
          sex = data.sex or 'male'
      })
  end

  HandlePreviewCamera(data.slot, true)
  cb({})
end)



local function toggleNuiFrame(shouldShow)
    SetNuiFocus(shouldShow, shouldShow)
    SendReactMessage('setVisible', shouldShow)
    
    DisplayRadar(false)

    local playerPed = PlayerPedId()
    SetEntityVisible(playerPed, false, false)
    SetEntityCoords(playerPed, -139.2098, 565.0248, 195.0446, false, false, false, true)
    FreezeEntityPosition(playerPed, true)
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
        HandlePreviewCamera(nil, false)
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
    Wait(1000)
    toggleNuiFrame(true)
end)

RegisterNUICallback('getCharacterSlots', function(data, cb)
    exports['kCore']:TriggerServerCallback('kCore:getCharacterSlots', function(response)
        if not response then
            cb({ error = "Failed to fetch character slots" })
            return
        end
        
        CharacterSlots = response.characters
        maxSlots = response.maxSlots

        if maxSlots > #characterPositions then      
            print('^1 MAX SLOTS MORE THAN CHARACTER POSITIONS')
            maxSlots = #characterPositions
        end

        if CharacterSlots then
            for slot, charData in pairs(CharacterSlots) do
                if charData then
                    UpdatePreviewPed(slot, charData)
                end
            end
        end
        
        cb({
            characters = CharacterSlots,
            maxSlots = maxSlots
        })
    end)
end)

RegisterNUICallback('selectCharacter', function(data, cb)
    if not data.slot then
        cb({ error = "No slot provided" })
        return
    end

    if data.preview then
        HandlePreviewCamera(data.slot, true)
        cb({})
        return
    end

    TriggerServerEvent('kCore:selectCharacter', data.slot)
    toggleNuiFrame(false)
    local playerPed = PlayerPedId()
    FreezeEntityPosition(playerPed, false)
    SetEntityVisible(playerPed, true, true)
    cb({})
end)

RegisterNUICallback('createCharacter', function(data, cb)
    if not data.slot or not data.firstName or not data.lastName then
        cb({ error = "Missing required fields" })
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
    print("Character loaded", json.encode(playerData))
end)


AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
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