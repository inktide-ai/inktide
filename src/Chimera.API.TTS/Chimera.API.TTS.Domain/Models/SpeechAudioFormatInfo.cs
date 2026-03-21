namespace Chimera.API.TTS.Domain.Models;

/// <summary>
/// Describes a supported TTS output container/codec for HTTP responses (commercial API style: id + MIME + file extension).
/// </summary>
public sealed class SpeechAudioFormatInfo
{
    #region Fields

    private string _id = string.Empty;
    private string _mimeType = string.Empty;
    private string _fileExtension = string.Empty;
    private string? _description;

    #endregion

    #region Properties

    /// <summary>
    /// Canonical format token sent to providers (e.g. <c>mp3</c>, <c>wav</c>).
    /// </summary>
    public string Id
    {
        get => _id;
        set => _id = value;
    }

    /// <summary>
    /// <c>Content-Type</c> for the synthesized audio body.
    /// </summary>
    public string MimeType
    {
        get => _mimeType;
        set => _mimeType = value;
    }

    /// <summary>
    /// Suggested download extension without a leading dot.
    /// </summary>
    public string FileExtension
    {
        get => _fileExtension;
        set => _fileExtension = value;
    }

    /// <summary>
    /// Optional human-readable hint for API catalogs.
    /// </summary>
    public string? Description
    {
        get => _description;
        set => _description = value;
    }

    #endregion
}
