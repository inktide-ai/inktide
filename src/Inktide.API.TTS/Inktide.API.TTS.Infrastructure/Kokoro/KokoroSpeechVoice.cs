namespace Inktide.API.Domain.Enums;

/// <summary>
/// Kokoro TTS voice id (OpenAI-compatible <c>voice</c> string). Known ids from <c>GET /v1/audio/voices</c>;
/// arbitrary strings remain valid via constructor or implicit conversion from <see cref="string"/>.
/// </summary>
public readonly struct KokoroSpeechVoice : IEquatable<KokoroSpeechVoice>
{

    private readonly string _value;


    private const string AfAlloyValue = "af_alloy";
    private const string AfAoedeValue = "af_aoede";
    private const string AfBellaValue = "af_bella";
    private const string AfHeartValue = "af_heart";
    private const string AfJadziaValue = "af_jadzia";
    private const string AfJessicaValue = "af_jessica";
    private const string AfKoreValue = "af_kore";
    private const string AfNicoleValue = "af_nicole";
    private const string AfNovaValue = "af_nova";
    private const string AfRiverValue = "af_river";
    private const string AfSarahValue = "af_sarah";
    private const string AfSkyValue = "af_sky";
    private const string AfV0Value = "af_v0";
    private const string AfV0BellaValue = "af_v0bella";
    private const string AfV0IrulanValue = "af_v0irulan";
    private const string AfV0NicoleValue = "af_v0nicole";
    private const string AfV0SarahValue = "af_v0sarah";
    private const string AfV0SkyValue = "af_v0sky";
    private const string AmAdamValue = "am_adam";
    private const string AmEchoValue = "am_echo";
    private const string AmEricValue = "am_eric";
    private const string AmFenrirValue = "am_fenrir";
    private const string AmLiamValue = "am_liam";
    private const string AmMichaelValue = "am_michael";
    private const string AmOnyxValue = "am_onyx";
    private const string AmPuckValue = "am_puck";
    private const string AmSantaValue = "am_santa";
    private const string AmV0AdamValue = "am_v0adam";
    private const string AmV0GurneyValue = "am_v0gurney";
    private const string AmV0MichaelValue = "am_v0michael";
    private const string BfAliceValue = "bf_alice";
    private const string BfEmmaValue = "bf_emma";
    private const string BfLilyValue = "bf_lily";
    private const string BfV0EmmaValue = "bf_v0emma";
    private const string BfV0IsabellaValue = "bf_v0isabella";
    private const string BmDanielValue = "bm_daniel";
    private const string BmFableValue = "bm_fable";
    private const string BmGeorgeValue = "bm_george";
    private const string BmLewisValue = "bm_lewis";
    private const string BmV0GeorgeValue = "bm_v0george";
    private const string BmV0LewisValue = "bm_v0lewis";
    private const string EfDoraValue = "ef_dora";
    private const string EmAlexValue = "em_alex";
    private const string EmSantaValue = "em_santa";
    private const string FfSiwisValue = "ff_siwis";
    private const string HfAlphaValue = "hf_alpha";
    private const string HfBetaValue = "hf_beta";
    private const string HmOmegaValue = "hm_omega";
    private const string HmPsiValue = "hm_psi";
    private const string IfSaraValue = "if_sara";
    private const string ImNicolaValue = "im_nicola";
    private const string JfAlphaValue = "jf_alpha";
    private const string JfGongitsuneValue = "jf_gongitsune";
    private const string JfNezumiValue = "jf_nezumi";
    private const string JfTebukuroValue = "jf_tebukuro";
    private const string JmKumoValue = "jm_kumo";
    private const string PfDoraValue = "pf_dora";
    private const string PmAlexValue = "pm_alex";
    private const string PmSantaValue = "pm_santa";
    private const string ZfXiaobeiValue = "zf_xiaobei";
    private const string ZfXiaoniValue = "zf_xiaoni";
    private const string ZfXiaoxiaoValue = "zf_xiaoxiao";
    private const string ZfXiaoyiValue = "zf_xiaoyi";
    private const string ZmYunjianValue = "zm_yunjian";
    private const string ZmYunxiValue = "zm_yunxi";
    private const string ZmYunxiaValue = "zm_yunxia";
    private const string ZmYunyangValue = "zm_yunyang";


    public KokoroSpeechVoice(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        _value = value;
    }


    // American English, female
    public static KokoroSpeechVoice AfAlloy { get; } = new KokoroSpeechVoice(AfAlloyValue);
    public static KokoroSpeechVoice AfAoede { get; } = new KokoroSpeechVoice(AfAoedeValue);
    public static KokoroSpeechVoice AfBella { get; } = new KokoroSpeechVoice(AfBellaValue);
    public static KokoroSpeechVoice AfHeart { get; } = new KokoroSpeechVoice(AfHeartValue);
    public static KokoroSpeechVoice AfJadzia { get; } = new KokoroSpeechVoice(AfJadziaValue);
    public static KokoroSpeechVoice AfJessica { get; } = new KokoroSpeechVoice(AfJessicaValue);
    public static KokoroSpeechVoice AfKore { get; } = new KokoroSpeechVoice(AfKoreValue);
    public static KokoroSpeechVoice AfNicole { get; } = new KokoroSpeechVoice(AfNicoleValue);
    public static KokoroSpeechVoice AfNova { get; } = new KokoroSpeechVoice(AfNovaValue);
    public static KokoroSpeechVoice AfRiver { get; } = new KokoroSpeechVoice(AfRiverValue);
    public static KokoroSpeechVoice AfSarah { get; } = new KokoroSpeechVoice(AfSarahValue);
    public static KokoroSpeechVoice AfSky { get; } = new KokoroSpeechVoice(AfSkyValue);
    public static KokoroSpeechVoice AfV0 { get; } = new KokoroSpeechVoice(AfV0Value);
    public static KokoroSpeechVoice AfV0Bella { get; } = new KokoroSpeechVoice(AfV0BellaValue);
    public static KokoroSpeechVoice AfV0Irulan { get; } = new KokoroSpeechVoice(AfV0IrulanValue);
    public static KokoroSpeechVoice AfV0Nicole { get; } = new KokoroSpeechVoice(AfV0NicoleValue);
    public static KokoroSpeechVoice AfV0Sarah { get; } = new KokoroSpeechVoice(AfV0SarahValue);
    public static KokoroSpeechVoice AfV0Sky { get; } = new KokoroSpeechVoice(AfV0SkyValue);
    
    // American English, male
    public static KokoroSpeechVoice AmAdam { get; } = new KokoroSpeechVoice(AmAdamValue);
    public static KokoroSpeechVoice AmEcho { get; } = new KokoroSpeechVoice(AmEchoValue);
    public static KokoroSpeechVoice AmEric { get; } = new KokoroSpeechVoice(AmEricValue);
    public static KokoroSpeechVoice AmFenrir { get; } = new KokoroSpeechVoice(AmFenrirValue);
    public static KokoroSpeechVoice AmLiam { get; } = new KokoroSpeechVoice(AmLiamValue);
    public static KokoroSpeechVoice AmMichael { get; } = new KokoroSpeechVoice(AmMichaelValue);
    public static KokoroSpeechVoice AmOnyx { get; } = new KokoroSpeechVoice(AmOnyxValue);
    public static KokoroSpeechVoice AmPuck { get; } = new KokoroSpeechVoice(AmPuckValue);
    public static KokoroSpeechVoice AmSanta { get; } = new KokoroSpeechVoice(AmSantaValue);
    public static KokoroSpeechVoice AmV0Adam { get; } = new KokoroSpeechVoice(AmV0AdamValue);
    public static KokoroSpeechVoice AmV0Gurney { get; } = new KokoroSpeechVoice(AmV0GurneyValue);
    public static KokoroSpeechVoice AmV0Michael { get; } = new KokoroSpeechVoice(AmV0MichaelValue);
    
    // British English, female
    public static KokoroSpeechVoice BfAlice { get; } = new KokoroSpeechVoice(BfAliceValue);
    public static KokoroSpeechVoice BfEmma { get; } = new KokoroSpeechVoice(BfEmmaValue);
    public static KokoroSpeechVoice BfLily { get; } = new KokoroSpeechVoice(BfLilyValue);
    public static KokoroSpeechVoice BfV0Emma { get; } = new KokoroSpeechVoice(BfV0EmmaValue);
    public static KokoroSpeechVoice BfV0Isabella { get; } = new KokoroSpeechVoice(BfV0IsabellaValue);
    
    // British English, male
    public static KokoroSpeechVoice BmDaniel { get; } = new KokoroSpeechVoice(BmDanielValue);
    public static KokoroSpeechVoice BmFable { get; } = new KokoroSpeechVoice(BmFableValue);
    public static KokoroSpeechVoice BmGeorge { get; } = new KokoroSpeechVoice(BmGeorgeValue);
    public static KokoroSpeechVoice BmLewis { get; } = new KokoroSpeechVoice(BmLewisValue);
    public static KokoroSpeechVoice BmV0George { get; } = new KokoroSpeechVoice(BmV0GeorgeValue);
    public static KokoroSpeechVoice BmV0Lewis { get; } = new KokoroSpeechVoice(BmV0LewisValue);
    
    // Europe, female
    public static KokoroSpeechVoice EfDora { get; } = new KokoroSpeechVoice(EfDoraValue);
    
    // Europe, male
    public static KokoroSpeechVoice EmAlex { get; } = new KokoroSpeechVoice(EmAlexValue);
    public static KokoroSpeechVoice EmSanta { get; } = new KokoroSpeechVoice(EmSantaValue);

    // French, female
    public static KokoroSpeechVoice FfSiwis { get; } = new KokoroSpeechVoice(FfSiwisValue);

    // Hindi, female
    public static KokoroSpeechVoice HfAlpha { get; } = new KokoroSpeechVoice(HfAlphaValue);
    public static KokoroSpeechVoice HfBeta { get; } = new KokoroSpeechVoice(HfBetaValue);

    // Hindi, male
    public static KokoroSpeechVoice HmOmega { get; } = new KokoroSpeechVoice(HmOmegaValue);
    public static KokoroSpeechVoice HmPsi { get; } = new KokoroSpeechVoice(HmPsiValue);

    // Italian, female
    public static KokoroSpeechVoice IfSara { get; } = new KokoroSpeechVoice(IfSaraValue);

    // Italian, male
    public static KokoroSpeechVoice ImNicola { get; } = new KokoroSpeechVoice(ImNicolaValue);

    // Japanese, female
    public static KokoroSpeechVoice JfAlpha { get; } = new KokoroSpeechVoice(JfAlphaValue);
    public static KokoroSpeechVoice JfGongitsune { get; } = new KokoroSpeechVoice(JfGongitsuneValue);
    public static KokoroSpeechVoice JfNezumi { get; } = new KokoroSpeechVoice(JfNezumiValue);
    public static KokoroSpeechVoice JfTebukuro { get; } = new KokoroSpeechVoice(JfTebukuroValue);

    // Japanese, male
    public static KokoroSpeechVoice JmKumo { get; } = new KokoroSpeechVoice(JmKumoValue);

    // Portuguese, female
    public static KokoroSpeechVoice PfDora { get; } = new KokoroSpeechVoice(PfDoraValue);

    // Portuguese, male
    public static KokoroSpeechVoice PmAlex { get; } = new KokoroSpeechVoice(PmAlexValue);
    public static KokoroSpeechVoice PmSanta { get; } = new KokoroSpeechVoice(PmSantaValue);

    // Chinese (Mandarin), female
    public static KokoroSpeechVoice ZfXiaobei { get; } = new KokoroSpeechVoice(ZfXiaobeiValue);
    public static KokoroSpeechVoice ZfXiaoni { get; } = new KokoroSpeechVoice(ZfXiaoniValue);
    public static KokoroSpeechVoice ZfXiaoxiao { get; } = new KokoroSpeechVoice(ZfXiaoxiaoValue);
    public static KokoroSpeechVoice ZfXiaoyi { get; } = new KokoroSpeechVoice(ZfXiaoyiValue);

    // Chinese (Mandarin), male
    public static KokoroSpeechVoice ZmYunjian { get; } = new KokoroSpeechVoice(ZmYunjianValue);
    public static KokoroSpeechVoice ZmYunxi { get; } = new KokoroSpeechVoice(ZmYunxiValue);
    public static KokoroSpeechVoice ZmYunxia { get; } = new KokoroSpeechVoice(ZmYunxiaValue);
    public static KokoroSpeechVoice ZmYunyang { get; } = new KokoroSpeechVoice(ZmYunyangValue);


    public static bool operator ==(KokoroSpeechVoice left, KokoroSpeechVoice right) => left.Equals(right);

    public static bool operator !=(KokoroSpeechVoice left, KokoroSpeechVoice right) => !left.Equals(right);

    public static implicit operator KokoroSpeechVoice(string value) => new KokoroSpeechVoice(value);

    public static implicit operator KokoroSpeechVoice?(string? value) =>
        value is null ? default : new KokoroSpeechVoice(value);


    public override bool Equals(object? obj) => obj is KokoroSpeechVoice other && Equals(other);

    public bool Equals(KokoroSpeechVoice other) =>
        string.Equals(_value, other._value, StringComparison.InvariantCultureIgnoreCase);

    public override int GetHashCode() =>
        _value is not null ? StringComparer.InvariantCultureIgnoreCase.GetHashCode(_value) : 0;

    public override string ToString() => _value;

}
