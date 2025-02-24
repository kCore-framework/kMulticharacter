cycleMode = false
local currentCam = nil
local isTransitioning = false
local TRANSITION_TIME = 10000
local SLOT_TRANSITION_TIME = 1000

local function CreateCycleCamera()
    if currentCam then return currentCam end
    local cam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamActive(cam, true)
    RenderScriptCams(true, false, TRANSITION_TIME, true, false, false)
    return cam
end

local function GetSortedSlots()
    local slots = {}
    for slot in pairs(Config.characterPositions) do
        table.insert(slots, slot)
    end
    table.sort(slots)
    return slots
end

local function UpdatePedAlpha(focusedSlot)
    for slot, ped in pairs(previewPeds) do
        if DoesEntityExist(ped) then
            SetEntityAlpha(ped, slot == focusedSlot and 255 or 200, false)
        end
    end
end

local function StartCycleCameras()
    if cycleMode then return end
    cycleMode = true
    
    currentCam = CreateCycleCamera()
    local slots = GetSortedSlots()
    
    CreateThread(function()
        while cycleMode do
            for i, currentSlot in ipairs(slots) do
                if not cycleMode then break end
                
                local nextSlot = slots[i + 1] or slots[1]
                local currentPos = Config.characterPositions[currentSlot].camPos
                local nextPos = Config.characterPositions[nextSlot].camPos
                
                SetCamCoord(currentCam, 
                    currentPos.coords.x, 
                    currentPos.coords.y, 
                    currentPos.coords.z
                )
                SetCamRot(currentCam, 
                    currentPos.rot.x, 
                    currentPos.rot.y, 
                    currentPos.rot.z, 
                    2
                )
                
                SetCamParams(currentCam, 
                    nextPos.coords.x, 
                    nextPos.coords.y, 
                    nextPos.coords.z, 
                    nextPos.rot.x, 
                    nextPos.rot.y, 
                    nextPos.rot.z, 
                    nextPos.fov, 
                    TRANSITION_TIME, 
                    1, 1, 2
                )
                
                Wait(TRANSITION_TIME)
            end
            Wait(0)
        end
    end)
end

local function TransitionToSlot(slot)
    if isTransitioning then return end
    isTransitioning = true
    
    local targetCamData = Config.characterPositions[slot].camPos
    local currentCoords = GetCamCoord(currentCam)
    local currentRot = GetCamRot(currentCam, 2)
    local newCam = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamCoord(newCam, currentCoords.x, currentCoords.y, currentCoords.z)
    SetCamRot(newCam, currentRot.x, currentRot.y, currentRot.z, 2)
    SetCamActive(newCam, true)
    SetCamParams(newCam, 
        targetCamData.coords.x, 
        targetCamData.coords.y, 
        targetCamData.coords.z, 
        targetCamData.rot.x, 
        targetCamData.rot.y, 
        targetCamData.rot.z, 
        targetCamData.fov, 
        SLOT_TRANSITION_TIME, 
        1, 1, 2
    )
    
    SetCamActiveWithInterp(newCam, currentCam, SLOT_TRANSITION_TIME)
    
    CreateThread(function()
        Wait(SLOT_TRANSITION_TIME)
        DestroyCam(currentCam, false)
        currentCam = newCam
        isTransitioning = false
    end)
    
    UpdatePedAlpha(slot)
end

function StopCameraCycle()
    cycleMode = false
end

function HandlePreviewCamera(slot, active)
    if active and slot then
        StopCameraCycle()
        TransitionToSlot(slot)
    else
        if slot == nil and not cycleMode then
            StartCycleCameras()
        else
            StopCameraCycle()
            if currentCam then
                SetCamActive(currentCam, false)
                RenderScriptCams(false, true, 0, true, true)
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
end

AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    StopCameraCycle()
    if currentCam then
        SetCamActive(currentCam, false)
        RenderScriptCams(false, true, 0, true, true)
        DestroyCam(currentCam, true)
        currentCam = nil
    end
end)